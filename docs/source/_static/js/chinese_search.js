/**
 * Chinese & English Intelligent Full-Text Search Engine for Sphinx
 * Fixes Sphinx CJK search limitations:
 * 1. Overrides splitQuery to segment Chinese using inverted index terms & bi-grams.
 * 2. Removes Sphinx's title length barrier (query.length >= title.length / 2).
 * 3. Supports partial matching for 2-character Chinese words.
 * 4. Implements coverage-aware relevance scoring (OR-match with AND-boost).
 */
(function() {
  // 1. Define global splitQuery immediately so searchtools.js does not overwrite it
  window.splitQuery = function(query) {
    if (!query) return [];
    var trimmed = query.trim();
    var result = new Set();

    // Latin words (English / numbers / technical terms like PassWall, LXC)
    var latinWords = trimmed.match(/[a-zA-Z0-9_\-\.]+/g) || [];
    for (var i = 0; i < latinWords.length; i++) {
      var lw = latinWords[i];
      if (lw.length > 1) {
        result.add(lw.toLowerCase());
      }
    }

    // Chinese sequences
    var cjkSequences = trimmed.match(/[\u4e00-\u9fa5]+/g) || [];
    var terms = (typeof Search !== 'undefined' && Search._index) ? Search._index.terms : null;
    var titleTerms = (typeof Search !== 'undefined' && Search._index) ? Search._index.titleterms : null;

    for (var s = 0; s < cjkSequences.length; s++) {
      var seq = cjkSequences[s];
      // Full sequence
      if ((terms && terms[seq]) || (titleTerms && titleTerms[seq]) || seq.length <= 4) {
        result.add(seq);
      }

      // Forward Maximum Matching against loaded index terms (window lengths 6 down to 2)
      var p = 0;
      while (p < seq.length) {
        var matched = false;
        var maxLen = Math.min(6, seq.length - p);
        for (var len = maxLen; len >= 2; len--) {
          var sub = seq.substr(p, len);
          if ((terms && terms[sub]) || (titleTerms && titleTerms[sub])) {
            result.add(sub);
            p += len;
            matched = true;
            break;
          }
        }
        if (!matched) {
          if (p + 1 < seq.length) {
            result.add(seq.substr(p, 2));
          }
          p++;
        }
      }

      // Bi-grams decomposition for robustness
      for (var j = 0; j < seq.length - 1; j++) {
        var bi = seq.substr(j, 2);
        if (!terms || terms[bi] || (titleTerms && titleTerms[bi])) {
          result.add(bi);
        }
      }
    }

    return Array.from(result);
  };

  // 2. Hook and Patch Search when Search is initialized
  function patchSphinxSearch() {
    if (typeof Search === 'undefined' || !Search._performSearch) {
      setTimeout(patchSphinxSearch, 20);
      return;
    }

    if (Search._chineseSearchPatched) return;
    Search._chineseSearchPatched = true;

    var origPerformSearch = Search._performSearch;

    Search._performSearch = function(query, searchTerms, excludedTerms, highlightTerms, objectTerms) {
      if (!Search._index) {
        return origPerformSearch.apply(this, arguments);
      }

      var filenames = Search._index.filenames;
      var docNames = Search._index.docnames;
      var titles = Search._index.titles;
      var allTitles = Search._index.alltitles || {};
      var terms = Search._index.terms || {};
      var titleTerms = Search._index.titleterms || {};
      var indexEntries = Search._index.indexentries || {};

      var normalResults = [];
      var nonMainIndexResults = [];

      var progressEl = document.getElementById("search-progress");
      if (progressEl && typeof _removeChildren === 'function') {
        _removeChildren(progressEl);
      }

      var queryLower = (query || "").toLowerCase().trim();

      // Ensure searchTerms contains all Chinese segmented tokens
      var effectiveTerms = new Set();
      searchTerms.forEach(function(t) { effectiveTerms.add(t); });
      var dynamicTerms = window.splitQuery(query);
      dynamicTerms.forEach(function(t) {
        effectiveTerms.add(t.toLowerCase());
        highlightTerms.add(t);
      });

      // 1. Direct Title & Section Heading Substring Matching
      for (var title in allTitles) {
        if (!allTitles.hasOwnProperty(title)) continue;
        var titleLower = title.toLowerCase();
        var titleScore = 0;

        if (titleLower.indexOf(queryLower) !== -1) {
          // Exact substring match in title receives supreme priority
          titleScore = 10000 + Math.round(1000 * (queryLower.length / Math.max(1, title.length)));
        } else {
          // Check term match in title
          var matchedInTitle = 0;
          effectiveTerms.forEach(function(term) {
            if (term.length >= 2 && titleLower.indexOf(term) !== -1) {
              matchedInTitle++;
            }
          });
          if (matchedInTitle > 0) {
            titleScore = 3000 + Math.round(2000 * (matchedInTitle / Math.max(1, effectiveTerms.size)));
          }
        }

        if (titleScore > 0) {
          var foundTitles = allTitles[title];
          for (var i = 0; i < foundTitles.length; i++) {
            var file = foundTitles[i][0];
            var id = foundTitles[i][1];
            var boost = (titles[file] === title) ? 200 : 0;
            normalResults.push([
              docNames[file],
              titles[file] !== title ? (titles[file] + " > " + title) : title,
              id !== null ? ("#" + id) : "",
              null,
              titleScore + boost,
              filenames[file],
              typeof SearchResultKind !== 'undefined' ? SearchResultKind.title : 1
            ]);
          }
        }
      }

      // 2. Index Entries search
      for (var entry in indexEntries) {
        if (!indexEntries.hasOwnProperty(entry)) continue;
        if (entry.toLowerCase().indexOf(queryLower) !== -1) {
          var foundEntries = indexEntries[entry];
          for (var k = 0; k < foundEntries.length; k++) {
            var eFile = foundEntries[k][0];
            var eId = foundEntries[k][1];
            var eMain = foundEntries[k][2];
            var eScore = Math.round(100 * (queryLower.length / Math.max(1, entry.length)));
            var eRes = [
              docNames[eFile],
              titles[eFile],
              eId ? ("#" + eId) : "",
              null,
              eScore,
              filenames[eFile],
              typeof SearchResultKind !== 'undefined' ? SearchResultKind.index : 0
            ];
            if (eMain) normalResults.push(eRes);
            else nonMainIndexResults.push(eRes);
          }
        }
      }

      // 3. Object search
      if (typeof Search.performObjectSearch === 'function') {
        objectTerms.forEach(function(term) {
          normalResults.push.apply(normalResults, Search.performObjectSearch(term, objectTerms));
        });
      }

      // 4. Inverted Full-Text Search
      var fileScoreMap = new Map();
      effectiveTerms.forEach(function(word) {
        var wordMatches = [];
        var scorerTitle = (typeof Scorer !== 'undefined' && Scorer.title) ? Scorer.title : 100;
        var scorerTerm = (typeof Scorer !== 'undefined' && Scorer.term) ? Scorer.term : 5;
        var scorerPartialTitle = (typeof Scorer !== 'undefined' && Scorer.partialTitle) ? Scorer.partialTitle : 7;
        var scorerPartialTerm = (typeof Scorer !== 'undefined' && Scorer.partialTerm) ? Scorer.partialTerm : 2;

        if (terms[word] !== undefined) {
          var f = terms[word];
          if (!Array.isArray(f)) f = [f];
          wordMatches.push({ files: f, score: scorerTerm });
        }
        if (titleTerms[word] !== undefined) {
          var f2 = titleTerms[word];
          if (!Array.isArray(f2)) f2 = [f2];
          wordMatches.push({ files: f2, score: scorerTitle });
        }

        // Support partial matching for words >= 2 chars
        if (word.length >= 2) {
          for (var tKey in titleTerms) {
            if (tKey !== word && tKey.indexOf(word) !== -1) {
              var f3 = titleTerms[tKey];
              if (!Array.isArray(f3)) f3 = [f3];
              wordMatches.push({ files: f3, score: scorerPartialTitle });
            }
          }
          for (var termKey in terms) {
            if (termKey !== word && termKey.indexOf(word) !== -1) {
              var f4 = terms[termKey];
              if (!Array.isArray(f4)) f4 = [f4];
              wordMatches.push({ files: f4, score: scorerPartialTerm });
            }
          }
        }

        for (var m = 0; m < wordMatches.length; m++) {
          var rec = wordMatches[m];
          for (var n = 0; n < rec.files.length; n++) {
            var fileIdx = rec.files[n];
            if (!fileScoreMap.has(fileIdx)) {
              fileScoreMap.set(fileIdx, { score: 0, matchedWords: new Set() });
            }
            var entryData = fileScoreMap.get(fileIdx);
            entryData.score += rec.score;
            entryData.matchedWords.add(word);
          }
        }
      });

      // Score full text hits
      fileScoreMap.forEach(function(data, fileIdx) {
        // Excluded terms check
        var isExcluded = false;
        excludedTerms.forEach(function(exWord) {
          if (
            terms[exWord] === fileIdx ||
            titleTerms[exWord] === fileIdx ||
            (Array.isArray(terms[exWord]) && terms[exWord].indexOf(fileIdx) !== -1) ||
            (Array.isArray(titleTerms[exWord]) && titleTerms[exWord].indexOf(fileIdx) !== -1)
          ) {
            isExcluded = true;
          }
        });
        if (isExcluded) return;

        var coverage = data.matchedWords.size / Math.max(1, effectiveTerms.size);
        var finalScore = data.score * (1 + coverage * 2);
        if (data.matchedWords.size === effectiveTerms.size) {
          finalScore += 500; // Perfect match boost
        }

        normalResults.push([
          docNames[fileIdx],
          titles[fileIdx],
          "",
          null,
          Math.round(finalScore),
          filenames[fileIdx],
          typeof SearchResultKind !== 'undefined' ? SearchResultKind.text : 2
        ]);
      });

      // Custom Scorer support
      if (typeof Scorer !== 'undefined' && Scorer.score) {
        normalResults.forEach(function(item) { item[4] = Scorer.score(item); });
        nonMainIndexResults.forEach(function(item) { item[4] = Scorer.score(item); });
      }

      // Sort results by score then name
      if (typeof _orderResultsByScoreThenName === 'function') {
        normalResults.sort(_orderResultsByScoreThenName);
        nonMainIndexResults.sort(_orderResultsByScoreThenName);
      }

      var results = nonMainIndexResults.concat(normalResults);

      // Deduplicate results
      var seen = new Set();
      var deduped = results.reverse().reduce(function(acc, result) {
        var key = result.slice(0, 4).concat([result[5]]).map(function(v) { return String(v); }).join(",");
        if (!seen.has(key)) {
          acc.push(result);
          seen.add(key);
        }
        return acc;
      }, []);

      return deduped.reverse();
    };
  }

  // Hook into lifecycle
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", patchSphinxSearch);
  } else {
    patchSphinxSearch();
  }
})();
