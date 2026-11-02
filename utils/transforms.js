const path = require('path')
const htmlmin = require('html-minifier-terser')
const critical = import('critical');
const buildDir = 'dist'

const shouldTransformHTML = (outputPath) =>
    outputPath &&
    outputPath.endsWith('.html') &&
    process.env.ELEVENTY_ENV === 'production'

// Eleventy 3 passes "./dist/index.html", Eleventy 2 passed "dist/index.html"
const isHomePage = (outputPath) =>
    path.normalize(outputPath) === path.join(buildDir, 'index.html')

process.setMaxListeners(Infinity)
module.exports = {
    htmlmin: function (content, outputPath) {
        if (shouldTransformHTML(outputPath)) {
            return htmlmin.minify(content, {
                collapseWhitespace: true,
                removeComments: true,
                minifyCSS: true,
                minifyJS: true,
            })
        }
        return content
    },

    critical: async function (content, outputPath) {
        if (shouldTransformHTML(outputPath) && isHomePage(outputPath)) {
            try {
                // critical re-serializes the page when inlining, which decodes
                // the obfuscated email, so only extract the CSS and inject it here
                const config = {
                    base: `${buildDir}/`,
                    html: content,
                    inline: false,
                    width: 1280,
                    height: 800
                }
                const { css } = await (await critical).critical(config)
                if (!css) throw new Error('critical returned no CSS')

                // preload stylesheets in place, apply them at the end of <body>
                const stylesheets = []
                const html = content
                    .replace(/<link rel="stylesheet"([^>]*)>/g, (match, attrs) => {
                        stylesheets.push(match)
                        return `<link rel="preload" as="style"${attrs}>`
                    })
                    .replace('<head>', `<head><style data-critical>${css}</style>`)
                    .replace('</body>', `${stylesheets.join('')}</body>`)
                return html
            } catch (err) {
                console.error(err)
            }
        }
        return content
    }
}
