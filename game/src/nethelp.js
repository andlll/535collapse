// [§9.158, richiesta dell'autore] I messaggi mirati quando la connessione
// della partita online non si apre (le cause: netdiag.js) e la pagina "Problemi
// di connessione": un pannello (netui.js) che si apre dalla sala d'attesa
// quando c'e' un problema, con quello che si e' capito, cosa provare dal
// piu' semplice, e i dettagli tecnici da copiare.

import { NetPanel, copyText } from "./netui.js";
import { tr } from "./i18n.js";

// una causa (netdiag.js diagnose) in parole; info.minutes per "slow"
export function causeText(cause, info = {}) {
  switch (cause) {
    case "local_none": return tr("Your browser did not give any address for the connection: a privacy setting or an extension (for example one that blocks WebRTC) is preventing direct connections. Allow them for this site, or try another browser.");
    case "remote_none": return tr("The other player's browser did not give any address for the connection: a privacy setting or an extension is preventing direct connections on their side.");
    case "local_blocked": return tr("Your network does not reach the address servers (STUN): a firewall, a company or school network or a VPN is probably blocking the connection on your side.");
    case "remote_blocked": return tr("The other player's network does not reach the address servers (STUN): a firewall, a company or school network or a VPN is probably blocking the connection on their side.");
    case "both_symmetric": return tr("Both networks change the port for every connection (symmetric NAT, common on mobile networks): a direct connection between them is not possible. One of you must use another network, for example home Wi-Fi.");
    case "local_symmetric": return tr("Your network changes the port for every connection (symmetric NAT, common on mobile networks and some routers): try again from another network, for example home Wi-Fi or a phone hotspot.");
    case "remote_symmetric": return tr("The other player's network changes the port for every connection (symmetric NAT, common on mobile networks and some routers): they should try again from another network.");
    case "family": return tr("One computer has only IPv6 addresses and the other only IPv4: they cannot reach each other. One of you must use another network.");
    case "same_network": return tr("You are on the same network, but the two computers cannot reach each other: the Wi-Fi may keep devices apart (guest network, device isolation). Use the main network, or connect one computer by cable.");
    case "slow": return tr("The codes were exchanged in {n} minutes: after a while the routers forget the addresses in the codes. Try again exchanging them within a minute.", { n: info.minutes ?? "?" });
    default: return tr("The networks did not let the connection through, and the codes do not say why: a firewall or an antivirus on one of the two computers, or a router that does not allow direct connections.");
  }
}

// le sezioni della pagina: [titolo, paragrafi]
const SECTIONS = [
  ["Before anything else", [
    "Both players need the same version of the game (the number at the bottom left of the main menu) and an up-to-date browser (Chrome, Edge or Firefox).",
    "Exchange the codes quickly, within a minute or two, and do not reload or close the page meanwhile: a code works only with the page that made it. If in doubt, start again: a new game, new codes."]],
  ["Try another network", [
    "Most failures depend on the network of one of the two players. The quickest test: one of you connects the computer to a phone hotspot (or, if already on a hotspot, to home Wi-Fi) and you try again.",
    "Mobile networks and some routers change the port for every connection (symmetric NAT): if both players are on such a network a direct connection is not possible, but it is enough that one of the two is on an ordinary home network."]],
  ["Company, school and public networks, VPNs", [
    "Offices, schools, hotels and public Wi-Fi often block the kind of traffic the game needs (UDP), and so can a VPN: turn the VPN off while playing, or try from another network."]],
  ["Firewall, antivirus, browser extensions", [
    "A firewall or an antivirus may block the browser's direct connections: allow the browser in its settings. Some privacy extensions and settings (in Brave, Firefox or uBlock, for example) turn off WebRTC or hide the addresses: allow it for this site."]],
  ["On the same network", [
    "If you are in the same house or office and it does not connect, the Wi-Fi may keep devices apart (guest networks, device isolation): use the main network, or connect one computer by cable."]],
  ["Other things to try", [
    "Swap roles: the other player creates the game. Restart the router; in its settings, turning on UPnP can help. Try another browser."]],
  ["If nothing works", [
    "Some pairs of networks can only connect through a relay server, which the game does not have yet. The technical details below say what each network allows: you can copy them and send them to whoever is helping you."]],
];
// (per la prova delle traduzioni)
export const HELP_TEXTS = SECTIONS.flatMap(([h, ps]) => [h, ...ps]);

// la pagina: causes (le cause trovate, se ce ne sono), details (il testo
// tecnico da copiare), minutes (per "slow"); onClose
export function showNetHelp({ causes = [], details = "", minutes = null, onClose = null } = {}) {
  const panel = new NetPanel({ onEscape: () => panel.close() });
  panel.onClose = onClose;
  panel.root.dataset.net = "help-page";
  // (sopra la sala d'attesa: quasi opaca, perche' non si legga quella sotto)
  panel.panel.style.background = "rgba(255, 255, 255, .97)";
  panel.title(tr("Connection problems"));
  panel.text(tr("The two games connect directly, without a server: each code contains the addresses where a computer can be reached, and the networks have to let the connection through. Here is what usually helps, from the simplest."));
  const found = causes.filter((k) => k !== "unknown");
  if (found.length) {
    panel.heading(tr("What went wrong"));
    for (const k of found) panel.text(causeText(k, { minutes }), { bullet: true });
  }
  for (const [h, ps] of SECTIONS) {
    panel.heading(tr(h));
    for (const p of ps) panel.text(tr(p));
  }
  if (details) {
    panel.heading(tr("Technical details"));
    const box = panel.code({ value: details, readonly: true, name: "details" });
    box.style.height = "110px";
    panel.button(panel.row(), tr("Copy"), async (b) => { if (await copyText(box)) panel.relabel(b, tr("Copied")); }, { name: "copy-details" });
  }
  panel.button(panel.row(), tr("Close"), () => panel.close(), { primary: true, name: "close-help" });
  panel.panel.scrollTop = 0;
  return panel;
}
