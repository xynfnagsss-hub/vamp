const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function build(){
  const outdir = path.join(__dirname,'../dist/client');
  if (!fs.existsSync(outdir)) fs.mkdirSync(outdir, { recursive: true });

  await esbuild.build({
    entryPoints: [path.join(__dirname,'../client/src/index.tsx')],
    bundle: true,
    minify: true,
    sourcemap: false,
    outfile: path.join(outdir,'index.js'),
    loader: { '.png': 'file', '.svg': 'file' },
    define: { 'process.env.NODE_ENV': '"production"' },
  });

  // copy index.html
  const htmlSrc = path.join(__dirname,'../client/src/index.html');
  let html = fs.readFileSync(htmlSrc,'utf8');
  // replace script src with bundled file
  html = html.replace('./index.js', './index.js');
  fs.writeFileSync(path.join(outdir,'index.html'), html);
  console.log('Client built to', outdir);
}

build().catch(e=>{ console.error(e); process.exit(1); });
