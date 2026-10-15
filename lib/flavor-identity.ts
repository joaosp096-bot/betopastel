const identities = [
  ["#884106", "#fff1d8", "sparkle", "catupiry", "Creamy"],
  ["#705000", "#fff5c8", "dots", "clássico", "Cheese"],
  ["#9e3022", "#ffe6de", "stripes", "pizza", "Pizza"],
  ["#8d4b35", "#f8e6dc", "grid", "tradicional", "Beef"],
  ["#884a16", "#fff0de", "dots", "dupla", "Beef"],
  ["#a35433", "#fce5d4", "checker", "trio", "Egg"],
  ["#735300", "#fff0c9", "stripes", "leve", "Drumstick"],
  ["#963b29", "#ffe5de", "grid", "calabresa", "Flame"],
  ["#813d39", "#f6e0de", "stripes", "carne seca", "Beef"],
  ["#805023", "#f5e8d5", "checker", "pernil", "Flame"],
  ["#2d6646", "#e4f1e6", "dots", "palmito", "Leaf"],
  ["#714691", "#f0e6fa", "sparkle", "tamanho 2×", "Crown"],
  ["#734231", "#f0e5dc", "dots", "doce", "Candy"],
  ["#923738", "#ffebe9", "sparkle", "camarão", "Fish"],
  ["#2d6930", "#e4f2df", "grid", "brócolis", "Sprout"],
  ["#893a22", "#ffe5d2", "checker", "defumado", "Flame"],
  ["#754e95", "#eee4f8", "stripes", "berinjela", "Leaf"],
  ["#516327", "#edf2d9", "grid", "jiló", "Sprout"],
  ["#2a6956", "#e0f3ed", "checker", "escarola", "Leaf"],
] as const;
export function identity(index: number) {
  const x = identities[Math.max(0, index) % identities.length];
  return { accent: x[0], tint: x[1], pattern: x[2], seal: x[3], icon: x[4] };
}
export const descriptions = [
  "Frango e catupiry",
  "Queijo derretido",
  "Presunto, queijo, tomate e orégano",
  "Carne temperada",
  "Carne e queijo",
  "Carne, queijo e ovo",
  "Frango e queijo",
  "Calabresa e queijo",
  "Carne seca e queijo",
  "Pernil e queijo",
  "Recheio de palmito",
  "Carne, queijo, ovo e presunto · dobro do tamanho",
  "Recheio de Nutella",
  "Camarão e catupiry",
  "Brócolis, queijo, calabresa e bacon",
  "Calabresa e bacon",
  "Berinjela e queijo",
  "Carne e jiló",
  "Escarola e queijo",
];

export function flavorIndex(id: string, fallback = 0) {
  const m = /^sabor-(\d+)$/.exec(id);
  return m ? Number(m[1]) : fallback;
}
export const flavorImages: Record<string, string> = {
  "sabor-0": "frango",
  "sabor-1": "queijo",
  "sabor-2": "pizza",
  "sabor-3": "carne",
  "sabor-4": "carne-queijo",
  "sabor-5": "carne-queijo-ovo",
  "sabor-6": "frango-queijo",
  "sabor-7": "calabresa-queijo",
  "sabor-8": "carne-seca",
  "sabor-9": "pernil",
  "sabor-10": "palmito",
  "sabor-11": "especial",
  "sabor-12": "nutella",
  "sabor-13": "camarao",
  "sabor-14": "brocolis",
  "sabor-16": "berinjela",
  "sabor-17": "jilo",
  "sabor-18": "escarola",
};
