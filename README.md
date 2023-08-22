# README

A set of slideshow and text utilities for Adobe After Effects.

<img width="344" alt="image" src="https://github.com/shawnphoffman/ae-photo-slideshow/assets/1154273/d85ca9d6-15b9-4c4c-b0e8-4ef0a338fa55">

## Inspiration

PCT selfie video.

## Execution

### Notes

As of Aug 2023, The font selection dropdown requires the After Effects Beta (24.0). It relies on the new `app.fonts.allFonts` API.

## Development

### Tooling I should probably add...

- https://github.com/ExtendScript/extendscriptr
  - `yarn add -D extendscriptr watch`
  - `extendscriptr --script src/scripts/helloWorld.js --output dist/helloWord.js`
  - `./node_modules/.bin/watch "./node_modules/.bin/extendscriptr --script src/helloWorld.js --output dist/helloWord.js" src/`
- https://github.com/ff6347/extendscript.prototypes
  - `yarn add -D extendscript.prototypes`
  - https://dev.to/umerjaved178/polyfills-for-foreach-map-filter-reduce-in-javascript-1h13

### Notes

- The [ExtendScript Debugger](https://marketplace.visualstudio.com/items?itemName=Adobe.extendscript-debug) extension is not compatible with native builds of VS Code for Apple Silicon but it is compatible running Rosetta. I worked around this by copying my VS Code, changing the name to "VS Code Rosetta", changing the "Run in Rosetta" property, and used that exclusively for developing this project.
- AVItem properties can be accessed using "match names" or using an index. The index matches the order displayed in the AE UI.

## Resources

These were extremely helpful while working on this project.

- [JavaScript Tools Guide CC](https://extendscript.docsforadobe.dev/)
- [After Effects Scripting Guide](https://ae-scripting.docsforadobe.dev/)
- [NTProductions GitHub Examples](https://github.com/NTProductions)
- [ChatGPT (for asking rough questions about how to do things)](https://chat.openai.com/)
<!-- - [xxx](xxx) -->

I didn't use these directly but found them useful later.

- [AE Snippets](https://github.com/ff6347/after-effects-script-snippets)
- https://github.com/ff6347/extendscript
- https://github.com/ExtendScript/wiki/wiki
<!-- - [xxx](xxx) -->
