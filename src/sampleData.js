export const samplePaycheck = {
  amount: 215.75,
  buckets: [
    {
      id: 1,
      name: "Checking and Free Spending",
      percentage: 30,
      amount: 64.73,
      categories: [
        { id: 1, name: "Checking and Free Spending", allocated: 0, spent: 0, type: "spending" },
        { id: 100, name: "Free Spending", allocated: 0, spent: 0, type: "spending" }
      ]
    },
    {
      id: 2,
      name: "Budgeting Needs",
      percentage: 25,
      amount: 53.94,
      categories: [
        { id: 2, name: "Food", allocated: 0, spent: 0, type: "spending" },
        { id: 3, name: "Gas", allocated: 0, spent: 0, type: "spending" },
        { id: 4, name: "Grocery Store", allocated: 0, spent: 0, type: "spending" },
        { id: 5, name: "Birth Control", allocated: 0, spent: 0, type: "spending" },
        { id: 6, name: "New Apartment", allocated: 0, spent: 0, type: "spending" },
        { id: 7, name: "Haircut", allocated: 0, spent: 0, type: "spending" },
        { id: 8, name: "School Clothes", allocated: 0, spent: 0, type: "spending" },
        { id: 9, name: "Self Care", allocated: 0, spent: 0, type: "spending" },
        { id: 10, name: "Concert Tickets", allocated: 0, spent: 0, type: "spending" },
        { id: 11, name: "David's Birthday", allocated: 0, spent: 0, type: "spending" },
        { id: 12, name: "David Christmas", allocated: 0, spent: 0, type: "spending" },
        { id: 13, name: "Gifts", allocated: 0, spent: 0, type: "spending" },
        { id: 14, name: "Christmas", allocated: 0, spent: 0, type: "spending" },
        { id: 15, name: "Other", allocated: 0, spent: 0, type: "spending" }
      ]
    },
    {
      id: 3,
      name: "Car Payment and Savings",
      percentage: 25,
      amount: 53.94,
      categories: [
        { id: 16, name: "Car Payment and Savings", allocated: 0, spent: 0, type: "spending" },
        { id: 101, name: "Car Savings", allocated: 0, spent: 0, type: "savings", goal: 1000 }
      ]
    },
    {
      id: 4,
      name: "Emergency Savings",
      percentage: 20,
      amount: 43.15,
      categories: [
        { id: 17, name: "539", allocated: 0, spent: 0, type: "savings", goal: 500 },
        { id: 18, name: "Savings", allocated: 0, spent: 0, type: "savings", goal: 1000 }
      ]
    }
  ]
}