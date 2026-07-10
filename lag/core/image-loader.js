/**
 * Image Loader - Get random images from recent watched, favorites, or homepage
 */

class ImageLoader {
    constructor() {
        this.imageCache = [];
    }

    /**
     * Get random image from recently watched, favorites, or homepage
     */
    async getRandomImage() {
        try {
            // Try to get from Lampa history/recently watched
            if (window.Lampa && window.Lampa.Storage) {
                const recent = window.Lampa.Storage.get('recently_watched');
                if (recent && recent.length > 0) {
                    return this.getImageFromItems(recent);
                }
            }

            // Try to get from favorites
            if (window.Lampa && window.Lampa.Storage) {
                const favorites = window.Lampa.Storage.get('favorites');
                if (favorites && favorites.length > 0) {
                    return this.getImageFromItems(favorites);
                }
            }

            // Return a placeholder or default image
            return this.getPlaceholderImage();
        } catch (e) {
            console.warn('[LAG] Error loading image:', e);
            return this.getPlaceholderImage();
        }
    }

    getImageFromItems(items) {
        if (!items || items.length === 0) {
            return this.getPlaceholderImage();
        }

        const item = items[Math.floor(Math.random() * Math.min(items.length, 5))];
        return item.poster_path || item.backdrop_path || this.getPlaceholderImage();
    }

    getPlaceholderImage() {
        // Return a data URL for a placeholder image
        return 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22600%22%3E%3Crect fill=%22%23333%22 width=%22400%22 height=%22600%22/%3E%3C/svg%3E';
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageLoader;
}
