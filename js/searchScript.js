// Import Firebase functions for backup data loading
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import app from "./firebaseSetup.js";

const firestore = getFirestore(app);

class FuzzySearch {
  constructor() {
    this.searchInput = document.getElementById('searchInput');
    this.searchResults = document.getElementById('searchResults');
    this.clearSearch = document.getElementById('clearSearch');
    this.blogsContainer = document.getElementById('blogs');
    this.allBlogs = [];
    this.isSearchActive = false;
    
    this.initializeSearch();
  }

  async initializeSearch() {
    // Try to use already loaded blogs data first
    await this.loadAllBlogs();
    this.bindEvents();
  }

  async loadAllBlogs() {
    try {
      // First, try to use already loaded blogs from the global variable
      if (window.blogsData && window.blogsData.length > 0) {
        this.allBlogs = window.blogsData.map(blog => ({
          ...blog,
          searchableText: `${blog.title} ${blog.subline} ${blog.content || ''} ${blog.author || ''}`.toLowerCase()
        }));
        return;
      }

      // If no global data, wait a bit and try again
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (window.blogsData && window.blogsData.length > 0) {
        this.allBlogs = window.blogsData.map(blog => ({
          ...blog,
          searchableText: `${blog.title} ${blog.subline} ${blog.content || ''} ${blog.author || ''}`.toLowerCase()
        }));
        return;
      }

      // As a fallback, load directly from Firebase
      console.log("hii")
      const querySnapshot = await getDocs(collection(firestore, "blogsRef"));
      console.log("hello")
      this.allBlogs = [];
      
      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        this.allBlogs.push({
          id: doc.id,
          title: docData.title,
          subline: docData.subline,
          content: docData.content || '',
          blogId: docData.blogId,
          author: docData.author || '',
          tags: docData.tags || [],
          createdAt: docData.createdAt || '',
          searchableText: `${docData.title} ${docData.subline} ${docData.content || ''} ${docData.author || ''}`.toLowerCase()
        });
      });
    } catch (error) {
      console.error('Error loading blogs for search:', error);
    }
  }

  bindEvents() {
    // Search input events
    this.searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
    this.searchInput.addEventListener('focus', this.handleFocus.bind(this));
    this.searchInput.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Clear search
    this.clearSearch.addEventListener('click', this.clearSearchResults.bind(this));
    
    // Close search when clicking outside
    document.addEventListener('click', this.handleOutsideClick.bind(this));
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  handleSearch(event) {
    const query = event.target.value.trim();
    
    if (query.length === 0) {
      this.clearSearchResults();
      return;
    }

    if (query.length < 2) {
      this.searchResults.style.display = 'none';
      return;
    }

    this.showSearchResults();
    this.performFuzzySearch(query);
  }

  handleFocus() {
    if (this.searchInput.value.trim().length >= 2) {
      this.showSearchResults();
    }
  }

  handleKeyDown(event) {
    if (event.key === 'Escape') {
      this.clearSearchResults();
      this.searchInput.blur();
    }
  }

  handleOutsideClick(event) {
    if (!event.target.closest('#searchContainer')) {
      this.hideSearchResults();
    }
  }

  showSearchResults() {
    this.searchResults.style.display = 'block';
    this.clearSearch.style.display = 'flex';
    this.isSearchActive = true;
  }

  hideSearchResults() {
    this.searchResults.style.display = 'none';
    this.isSearchActive = false;
  }

  clearSearchResults() {
    this.searchInput.value = '';
    this.searchResults.style.display = 'none';
    this.clearSearch.style.display = 'none';
    this.isSearchActive = false;
    this.searchInput.focus();
  }

  performFuzzySearch(query) {
    const results = this.fuzzySearchBlogs(query);
    this.displaySearchResults(results, query);
  }

  fuzzySearchBlogs(query) {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0);
    
    const results = this.allBlogs.map(blog => {
      let score = 0;
      let matches = [];

      // Title matching (highest weight)
      const titleScore = this.calculateFuzzyScore(blog.title.toLowerCase(), queryLower);
      if (titleScore > 0) {
        score += titleScore * 3;
        matches.push({ field: 'title', score: titleScore });
      }

      // Subline matching (medium weight)
      const sublineScore = this.calculateFuzzyScore(blog.subline.toLowerCase(), queryLower);
      if (sublineScore > 0) {
        score += sublineScore * 2;
        matches.push({ field: 'subline', score: sublineScore });
      }

      // Content matching (lower weight)
      const contentScore = this.calculateFuzzyScore(blog.content.toLowerCase(), queryLower);
      if (contentScore > 0) {
        score += contentScore * 1;
        matches.push({ field: 'content', score: contentScore });
      }

      // Word-by-word matching for better results
      queryWords.forEach(word => {
        if (blog.searchableText.includes(word)) {
          score += 0.5;
        }
      });

      // Exact phrase bonus
      if (blog.searchableText.includes(queryLower)) {
        score += 2;
      }

      return {
        ...blog,
        searchScore: score,
        matches: matches
      };
    }).filter(blog => blog.searchScore > 0);

    // Sort by relevance score
    return results.sort((a, b) => b.searchScore - a.searchScore);
  }

  calculateFuzzyScore(text, query) {
    if (!text || !query) return 0;
    
    // Exact match gets highest score
    if (text === query) return 10;
    
    // Starts with query gets high score
    if (text.startsWith(query)) return 8;
    
    // Contains query gets medium score
    if (text.includes(query)) return 6;
    
    // Fuzzy matching using Levenshtein-like algorithm
    return this.fuzzyMatch(text, query);
  }

  fuzzyMatch(text, query) {
    const textLen = text.length;
    const queryLen = query.length;
    
    if (queryLen > textLen) return 0;
    
    let score = 0;
    let textIndex = 0;
    let queryIndex = 0;
    
    while (textIndex < textLen && queryIndex < queryLen) {
      if (text[textIndex] === query[queryIndex]) {
        score++;
        queryIndex++;
      }
      textIndex++;
    }
    
    // If we matched all query characters
    if (queryIndex === queryLen) {
      return (score / queryLen) * 4; // Scale to reasonable score
    }
    
    return 0;
  }

  highlightText(text, query) {
    if (!text || !query) return text;
    
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    
    // Find all matches
    const matches = [];
    let index = textLower.indexOf(queryLower);
    
    while (index !== -1) {
      matches.push({ start: index, end: index + query.length });
      index = textLower.indexOf(queryLower, index + 1);
    }
    
    // If no exact matches, try word-by-word highlighting
    if (matches.length === 0) {
      const queryWords = queryLower.split(/\s+/);
      queryWords.forEach(word => {
        if (word.length > 2) {
          let wordIndex = textLower.indexOf(word);
          while (wordIndex !== -1) {
            matches.push({ start: wordIndex, end: wordIndex + word.length });
            wordIndex = textLower.indexOf(word, wordIndex + 1);
          }
        }
      });
    }
    
    // Sort matches by position
    matches.sort((a, b) => a.start - b.start);
    
    // Remove overlapping matches
    const cleanMatches = [];
    matches.forEach(match => {
      if (cleanMatches.length === 0 || match.start >= cleanMatches[cleanMatches.length - 1].end) {
        cleanMatches.push(match);
      }
    });
    
    // Apply highlighting
    if (cleanMatches.length === 0) return text;
    
    let result = '';
    let lastEnd = 0;
    
    cleanMatches.forEach(match => {
      result += text.substring(lastEnd, match.start);
      result += `<span class="highlight">${text.substring(match.start, match.end)}</span>`;
      lastEnd = match.end;
    });
    
    result += text.substring(lastEnd);
    return result;
  }

  displaySearchResults(results, query) {
    if (results.length === 0) {
      this.searchResults.innerHTML = `
        <div class="no-results">
          <div class="search-empty-state">
            <p>No blogs found for "${query}"</p>
            <small>Try different keywords or check your spelling</small>
          </div>
        </div>
      `;
      return;
    }

    const searchStats = `
      <div class="search-stats">
        Found ${results.length} result${results.length === 1 ? '' : 's'} for "${query}"
      </div>
    `;

    const resultItems = results.slice(0, 10).map(blog => {
      const highlightedTitle = this.highlightText(blog.title, query);
      const highlightedSubline = this.highlightText(blog.subline, query);
      
      return `
        <div class="search-result-item" onclick="window.location.href='/viewBlog?blogId=${blog.blogId}'" tabindex="0">
          <img class="search-result-image" src="./assets/placeholderImage.jpg" alt="Blog thumbnail">
          <div class="search-result-content">
            <h4 class="search-result-title">${highlightedTitle}</h4>
            <p class="search-result-snippet">${highlightedSubline}</p>
          </div>
        </div>
      `;
    }).join('');

    this.searchResults.innerHTML = searchStats + resultItems;
    
    // Add keyboard navigation
    this.addKeyboardNavigation();
  }

  addKeyboardNavigation() {
    const resultItems = this.searchResults.querySelectorAll('.search-result-item');
    
    resultItems.forEach((item, index) => {
      item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          item.click();
        } else if (event.key === 'ArrowDown' && index < resultItems.length - 1) {
          resultItems[index + 1].focus();
          event.preventDefault();
        } else if (event.key === 'ArrowUp' && index > 0) {
          resultItems[index - 1].focus();
          event.preventDefault();
        } else if (event.key === 'ArrowUp' && index === 0) {
          this.searchInput.focus();
          event.preventDefault();
        }
      });
    });
  }
}

// Initialize search when DOM is loaded and blogs are ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait for blogs to be loaded
  const initSearch = () => {
    if (window.blogsData && window.blogsData.length > 0) {
      new FuzzySearch();
    } else {
      // Check again after a short delay
      setTimeout(initSearch, 500);
    }
  };
  
  // Start checking after initial delay
  setTimeout(initSearch, 1000);
});

export default FuzzySearch;
