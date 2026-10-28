import { Scanner } from '@tailwindcss/oxide';

const scanner = new Scanner({
  sources: [
    { base: process.cwd(), pattern: "**/*", negated: false }
  ]
});
scanner.scan();
console.log('Number of files in scanner.files:', scanner.files.length);
console.log('Sample files:', scanner.files.slice(0, 10));
