#!/usr/bin/env node
const args = process.argv.slice(2);
const API = process.env.VAMP_API || 'http://localhost:4000/api/admin';

function printBox(lines) {
  console.log('================================');
  for (const l of lines) console.log(l);
  console.log('================================');
}

async function main() {
  const cmd = args[0];
  if (cmd === 'generate') {
    const dur = args[1] || '1y';
    const res = await globalThis.fetch(`${API}/licenses`, {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({duration:dur})});
    const j = await res.json();
    if (!j.ok) return console.error('Error:', j);
    const lic = j.license;
    printBox([
      '          VAMP LICENSE',
      `Duration: ${lic.duration}`,
      `Key: ${lic.key}`,
      `Created: ${lic.created}`,
      `Expires: ${lic.expires || 'Never'}`
    ]);
    return;
  }
  if (cmd === 'list') {
    const res = await globalThis.fetch(`${API}/licenses`);
    const j = await res.json();
    if (!j.ok) return console.error('Error');
    console.table(j.licenses);
    return;
  }
  if (cmd === 'revoke') {
    const id = args[1];
    if (!id) return console.error('Please provide ID');
    const res = await globalThis.fetch(`${API}/licenses/${id}/revoke`, {method:'POST'});
    const j = await res.json();
    console.log(j);
    return;
  }
  if (cmd === 'reset-device') {
    const id = args[1];
    if (!id) return console.error('Please provide ID');
    const res = await globalThis.fetch(`${API}/licenses/${id}/reset-device`, {method:'POST'});
    const j = await res.json();
    console.log(j);
    return;
  }
  console.log('Usage: vamp-license generate|list|revoke|reset-device');
}

main().catch(err => { console.error(err); process.exit(1); });
