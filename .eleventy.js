const pluginRss = require('@11ty/eleventy-plugin-rss')
const markdownIt = require('markdown-it')

const filters = require('./utils/filters.js')
const transforms = require('./utils/transforms.js')
const shortcodes = require('./utils/shortcodes.js')
const iconsprite = require('./utils/iconsprite.js')

module.exports = function (config) {
    // Plugins
    config.addPlugin(pluginRss)

    // Filters
    Object.keys(filters).forEach((filterName) => {
        config.addFilter(filterName, filters[filterName])
    })

    // Transforms
    Object.keys(transforms).forEach((transformName) => {
        config.addTransform(transformName, transforms[transformName])
    })

    // Shortcodes
    Object.keys(shortcodes).forEach((shortcodeName) => {
        config.addShortcode(shortcodeName, shortcodes[shortcodeName])
    })

    // Icon Sprite
    config.addNunjucksAsyncShortcode('iconsprite', iconsprite)

    // Asset Watch Targets
    config.addWatchTarget('./src/assets')

    // Markdown
    config.setLibrary(
        'md',
        markdownIt({
            html: true,
            breaks: true,
            linkify: true,
            typographer: true
        })
    )

    // Layouts
    config.addLayoutAlias('base', 'base.njk')
    config.addLayoutAlias('resume', 'resume.njk')

    // Collections
    const collections = ['work', 'education', 'projects', 'awards', 'community']
    collections.forEach((name) => {
        config.addCollection(name, function (collection) {
            const folderRegex = new RegExp(`\/${name}\/`)
            const inEntryFolder = (item) =>
                item.inputPath.match(folderRegex) !== null

            const byStartDate = (a, b) => {
                if (a.data.start && b.data.start) {
                    return a.data.start - b.data.start
                }
                return 0
            }

            const byReleaseDate = (a, b) => {
                if (a.data.releaseDate && b.data.releaseDate) {
                    return a.data.releaseDate - b.data.releaseDate
                }
                return 0
            }

            const byDateReceived = (a, b) => {
                if (a.data.dateReceived && b.data.dateReceived) {
                    return a.data.dateReceived - b.data.dateReceived
                }
                return 0
            }

            if (name == 'projects') {
                return collection
                    .getAllSorted()
                    .filter(inEntryFolder)
                    .sort(byReleaseDate)
            } else if (name == 'awards') {
                return collection
                    .getAllSorted()
                    .filter(inEntryFolder)
                    .sort(byDateReceived)
            } else {
                return collection
                    .getAllSorted()
                    .filter(inEntryFolder)
                    .sort(byStartDate)
            }
        })
    })

    // Pass-through files
    config.addPassthroughCopy('src/robots.txt')
    config.addPassthroughCopy('src/assets/images')
    config.addPassthroughCopy('src/assets/fonts')

    // Deep-Merge
    config.setDataDeepMerge(true)

    // Debug logging
    config.addFilter("debug", function(value) {
        console.log(value);
        return value;
    });

    // Base Config
    return {
        dir: {
            input: 'src',
            output: 'dist',
            includes: 'includes',
            layouts: 'layouts',
            data: 'data'
        },
        templateFormats: ['njk', 'md', '11ty.js'],
        htmlTemplateEngine: 'njk',
        markdownTemplateEngine: 'njk'
    }
}
