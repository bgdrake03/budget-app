export const samplePaycheck = {
    amount: 215.75,
    buckets: [
        {
            id: 1,
            name: "Checking/Free Spending",
            percentage: 30,
            amount: 64.73,
            categories: [
                { id: 1, name: "Food", budget: 50, spent: 0 },
                { id: 2, name: "Gas", budget: 60, spent: 0 }
            ]
        },
        {
            id: 2,
            name: "Budgeting Needs",
            percentage: 25,
            amount: 53.94,
            categories: [
                { id: 3, name: "Groceries", budget: 30, spent: 0 },
                { id: 3, name: "Bills", budget: 20, spent: 0}
            ]
        }
    ]
}