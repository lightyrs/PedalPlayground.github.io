const jsonfile = require("jsonfile");

const rankSortDesc = (firstKey, secondKey) => (a, b) => {
  if (a[firstKey].localeCompare(b[firstKey], undefined, { sensitivity: "base" }) == 0) {
    return a[secondKey].localeCompare(b[secondKey], undefined, { sensitivity: "base" });
  } else {
    return a[firstKey].localeCompare(b[firstKey], undefined, { sensitivity: "base" });
  }
};

const dedupeItemsByKeys = (items, keys) => {
  const mySet = new Set();
  return items.filter((item) => {
    let newItem = keys.map((k) => item[k]).join("-");
    return !mySet.has(newItem) && mySet.add(newItem);
  });
};

const pedalboardsPath = "./public/data/pedalboards.json";
const pedalsPath = "./public/data/pedals.json";
const keys = ["Brand", "Name"];

jsonfile
  .readFile(pedalboardsPath)
  .then((pedalboards) => {
    console.log("Writing pedalboards.json");
    jsonfile.writeFileSync(
      pedalboardsPath,
      dedupeItemsByKeys(pedalboards, keys).sort(rankSortDesc(...keys)),
      { spaces: 2 }
    );
  })
  .catch((error) => console.error(error));

jsonfile
  .readFile(pedalsPath)
  .then((pedals) => {
    console.log("Writing pedals.json");
    jsonfile.writeFileSync(
      pedalsPath,
      dedupeItemsByKeys(pedals, keys).sort(rankSortDesc(...keys)),
      { spaces: 2 }
    );
  })
  .catch((error) => console.error(error));
