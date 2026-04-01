const mangayomiSources = [{
    "name": "HentaiLA",
    "lang": "es",
    "baseUrl": "https://hentaila.com",
    "apiUrl": "",
    "iconUrl": "https://raw.githubusercontent.com/DanielDRN/MangaYomi/main/javascript/icon/zh.hentai.png",
    "typeSource": "single",
    "itemType": 1,
    "isNsfw": true,
    "version": "0.0.1",
    "dateFormat": "",
    "dateFormatLocale": "",
    "pkgPath": "anime/src/es/hentaila.js"
}];

class DefaultExtension extends MProvider {
    async getPopular(page) {
        const baseUrl = this.source.baseUrl;
        const res = await new Client().get(`${baseUrl}/?page=${page}`);

        return this.animeFromElement(res.body);
    }

    async getLatestUpdates(page) {
        const baseUrl = this.source.baseUrl;
        const res = await new Client().get(`${baseUrl}/?page=${page}`);

        return this.animeFromElement(res.body);
    }

    async search(query, page, filters) {
        const baseUrl = this.source.baseUrl;
        let url = `${baseUrl}/catalogo?page=${page}`;
        
        if (query) {
            url += `&q=${encodeURIComponent(query)}`;
        }
        
        // Handle filters
        if (filters && filters.length > 0) {
            for (const filter of filters) {
                if (filter.type === "genre" && filter.values && filter.values.length > 0) {
                    for (const genre of filter.values) {
                        if (genre.state) {
                            url += `&genre=${genre.value}`;
                        }
                    }
                }
            }
        }

        const res = await new Client().get(url);
        return this.animeFromElement(res.body);
    }

    async getDetail(url) {
        const baseUrl = this.source.baseUrl;
        const res = await new Client().get(baseUrl + url);
        const document = new Document(res.body);
        
        const title = document.selectFirst("h1").text.trim();
        const description = document.selectFirst("div.description, div.sinopsis")?.text?.trim() || "";
        const genres = document.select("a[href*='genre']").map(e => e.text.trim());
        const status = this.parseStatus(document.selectFirst("span.status, .status")?.text?.trim() || "En emisión");
        
        const episodeList = [];
        const episodeElements = document.select("div.episode-item, .episode a, a[href*='/media/']");
        
        for (let i = 0; i < episodeElements.length; i++) {
            const element = episodeElements[i];
            const episodeUrl = element.attr("href");
            const episodeName = element.selectFirst("span.title, .title")?.text?.trim() || `Episodio ${i + 1}`;
            
            if (episodeUrl && episodeUrl.includes("/media/")) {
                episodeList.push({ name: episodeName, url: episodeUrl });
            }
        }
        
        // If no episodes found, try to find episode links in scripts or other patterns
        if (episodeList.length === 0) {
            const scripts = document.select("script");
            for (const script of scripts) {
                const text = script.text;
                if (text.includes("episodes") || text.includes("media")) {
                    // Try to extract episode information from scripts
                    const episodeMatches = text.match(/\/media\/[^\/]+\/\d+/g);
                    if (episodeMatches) {
                        for (let i = 0; i < episodeMatches.length; i++) {
                            const epUrl = episodeMatches[i];
                            episodeList.push({ name: `Episodio ${i + 1}`, url: epUrl });
                        }
                    }
                }
            }
        }

        return {
            description,
            status,
            genre: genres,
            episodes: episodeList
        };
    }

    async getVideoList(url) {
        const res = await new Client().get(url);
        const document = new Document(res.body);
        
        const videos = [];
        
        // Look for video sources in various places
        const videoElements = document.select("video source, iframe, script:contains('video')");
        
        for (const element of videoElements) {
            if (element.tagName === "SOURCE") {
                const videoUrl = element.attr("src");
                if (videoUrl) {
                    videos.push({
                        url: videoUrl,
                        quality: "Default",
                        originalUrl: videoUrl
                    });
                }
            } else if (element.tagName === "IFRAME") {
                const iframeUrl = element.attr("src");
                if (iframeUrl) {
                    // Try to extract video from iframe
                    try {
                        const iframeRes = await new Client().get(iframeUrl);
                        const iframeDoc = new Document(iframeRes.body);
                        const iframeVideos = iframeDoc.select("video source");
                        for (const src of iframeVideos) {
                            const videoUrl = src.attr("src");
                            if (videoUrl) {
                                videos.push({
                                    url: videoUrl,
                                    quality: "Default",
                                    originalUrl: videoUrl
                                });
                            }
                        }
                    } catch (e) {
                        // Ignore iframe errors
                    }
                }
            }
        }
        
        // Look in scripts for video URLs
        const scripts = document.select("script");
        for (const script of scripts) {
            const text = script.text;
            const videoMatches = text.match(/"(https?:\/\/[^"]*\.(?:mp4|m3u8|avi|flv)[^"]*)"/gi);
            if (videoMatches) {
                for (const match of videoMatches) {
                    const videoUrl = match.replace(/"/g, "");
                    videos.push({
                        url: videoUrl,
                        quality: "Default",
                        originalUrl: videoUrl
                    });
                }
            }
        }

        return videos;
    }

    animeFromElement(body) {
        const document = new Document(body);
        const elements = document.select("article, .hentai-item, .media-item");
        const list = [];

        for (const element of elements) {
            const titleElement = element.selectFirst("h3, .title, a[href*='/media/']");
            const name = titleElement?.text?.trim() || "";
            
            const linkElement = element.selectFirst("a[href*='/media/']");
            const link = linkElement?.attr("href") || "";
            
            const imageElement = element.selectFirst("img");
            const imageUrl = imageElement?.attr("src") || imageElement?.attr("data-src") || "";
            
            if (name && link) {
                list.push({ 
                    name, 
                    imageUrl: imageUrl.startsWith("http") ? imageUrl : this.source.baseUrl + imageUrl, 
                    link 
                });
            }
        }

        // Check for pagination
        const nextPageElement = document.selectFirst("a.next, .pagination .next, a[href*='page=']");
        const hasNextPage = nextPageElement !== null;

        return {
            list,
            hasNextPage
        };
    }

    parseStatus(statusString) {
        if (statusString.includes("En emisión") || statusString.includes("En emision")) {
            return 0; // Ongoing
        } else if (statusString.includes("Finalizado") || statusString.includes("Concluido")) {
            return 1; // Completed
        } else {
            return 5; // Unknown
        }
    }

    getSourcePreferences() {
        return [
            {
                "key": "preferred_quality",
                "listPreference": {
                    "title": "Preferred quality",
                    "summary": "",
                    "valueIndex": 0,
                    "entries": [
                        "1080p",
                        "720p",
                        "480p",
                        "360p",
                    ],
                    "entryValues": [
                        "1080",
                        "720",
                        "480",
                        "360",
                    ]
                }
            }
        ];
    }
}
