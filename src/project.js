'use strict';

const CONFIG_FILENAME = 'novon.config.json';
const CONTENT_DIRECTORY = 'content';
const ENTRY_PAGE_FILENAME = 'index.mdx';
const ENTRY_PAGE_PATH = `${CONTENT_DIRECTORY}/${ENTRY_PAGE_FILENAME}`;
const OUTPUT_DIRECTORY = 'dist';

const INITIAL_CONFIG = Object.freeze({
  contentDir: CONTENT_DIRECTORY,
  outputDir: OUTPUT_DIRECTORY,
});

const INITIAL_CONFIG_TEXT = `${JSON.stringify(INITIAL_CONFIG, null, 2)}\n`;

const EXAMPLE_PAGE = `---
title: Welcome to novon
---

# Welcome to novon

This is your first novon page. Edit this file to start writing.
`;

module.exports = {
  CONFIG_FILENAME,
  CONTENT_DIRECTORY,
  ENTRY_PAGE_FILENAME,
  ENTRY_PAGE_PATH,
  OUTPUT_DIRECTORY,
  INITIAL_CONFIG,
  INITIAL_CONFIG_TEXT,
  EXAMPLE_PAGE,
};
