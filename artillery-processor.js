/**
 * Artillery processor for queue load testing
 * Generates random names and items for each request
 */

function generateItems() {
  const items = [];
  
  // Randomly add chai (70% chance)
  if (Math.random() > 0.3) {
    items.push({
      name: "Irani Chai",
      qty: Math.floor(Math.random() * 3) + 1 // 1-3 chai
    });
  }
  
  // Randomly add bun (50% chance)
  if (Math.random() > 0.5) {
    items.push({
      name: "Bun",
      qty: Math.floor(Math.random() * 2) + 1 // 1-2 bun
    });
  }
  
  // Ensure at least one item
  if (items.length === 0) {
    items.push({
      name: "Irani Chai",
      qty: 1
    });
  }
  
  return items;
}

function generateRandomName() {
  const names = [
    "Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry",
    "Ivy", "Jack", "Kate", "Liam", "Mia", "Noah", "Olivia", "Paul",
    "Quinn", "Rachel", "Sam", "Tina", "Uma", "Victor", "Wendy", "Xavier",
    "Yara", "Zoe"
  ];
  const randomName = names[Math.floor(Math.random() * names.length)];
  const randomNum = Math.floor(Math.random() * 1000);
  return `${randomName} ${randomNum}`;
}

function setUserData(context, events, done) {
  context.vars.userName = generateRandomName();
  context.vars.userItems = generateItems();
  return done();
}

module.exports = {
  generateItems,
  generateRandomName,
  setUserData
};

