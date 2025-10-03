const apiKey = '5d42ea42d14fc3953dee9b3f';
const API_URL = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;

async function populateCurrencies() {
    try {
        const response = await fetch(API_URL);  // Fetching the currency data from the API
        const data = await response.json();  


        if (data.result !== "success") {
            throw new Error("API error");  // Check if the API response is successful
        }

        const currencies = Object.keys(data.conversion_rates);  // Extract the list of currencies and populate dropdowns
        const fromCurrency = document.getElementById("from-currency");
        const toCurrency = document.getElementById("to-currency");
        currencies.forEach((currency) => {
            const option1 = document.createElement("option");
            const option2 = document.createElement("option");
            option1.value = option2.value = currency;
            option1.textContent = currency;
            option2.textContent = currency;

            fromCurrency.appendChild(option1);
            toCurrency.appendChild(option2);
        });
        toCurrency.value = "INR";  // Set default value of toCurrency dropdown to INR

    } catch (error) {
        console.error("Error fetching currency data:", error);
        alert("Error fetching currency data!");
    }
}

document.getElementById("currency-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const amount = parseFloat(document.getElementById("amount").value);
    const fromCurrency = document.getElementById("from-currency").value;
    const toCurrency = document.getElementById("to-currency").value;

    // If the currencies are the same, no conversion is needed
    if (fromCurrency === toCurrency) {
        document.getElementById("result").textContent = `Converted amount: ${amount.toFixed(2)} ${toCurrency}`;
        return;
    }
    try {
        const response = await fetch(`${API_URL}`);
        const data = await response.json();

        if (data.result !== "success") {
            throw new Error("API error");
        }
        const rate = data.conversion_rates[toCurrency];
        const convertedAmount = (amount * rate).toFixed(2);
        document.getElementById("result").textContent = `${amount} ${fromCurrency} = ${convertedAmount} ${toCurrency}`;

        calculateArbitrage(amount, fromCurrency, toCurrency, data.conversion_rates);
    } catch (error) {
        console.error("Error converting currency:", error);
        document.getElementById("result").textContent = "Error converting currency.";
    }
});

// To reset the result and arbitrage data
document.getElementById("reset-button").addEventListener("click", () => {
    document.getElementById("result").textContent = "Converted Currency";
    document.getElementById("arbitrage").innerHTML = "";
});

async function calculateArbitrage(amount, fromCurrency, toCurrency, rates) {
    const arbitrageDiv = document.getElementById("arbitrage");
    arbitrageDiv.innerHTML = "";

    try {       // Find intermediate currencies for arbitrage (excluding from and to currencies)
        const intermediateCurrencies = Object.keys(rates).filter(
            (currency) => currency !== fromCurrency && currency !== toCurrency
        );

        const arbitrageResults = await Promise.all(
            intermediateCurrencies.map(async (intermediate) => {
                const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${intermediate}`);
                const data = await response.json();

                const intermediateRate = rates[intermediate];
                const finalRate = data.conversion_rates[toCurrency];
                if (intermediateRate && finalRate) {
                    const arbitrageAmount = (amount * intermediateRate * finalRate).toFixed(2);
                    return {
                        path: `${fromCurrency} ➝ ${intermediate} ➝ ${toCurrency}`,
                        amount: arbitrageAmount,
                    };
                }
                return null;
            })
        );
        const sortedResults = arbitrageResults       // Sort the arbitrage results in descending order and take top 3
            .filter((result) => result !== null)
            .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
            .slice(0, 3);
        sortedResults.forEach((result) => {
            const p = document.createElement("p");
            p.textContent = `${result.path}: ${result.amount} ${toCurrency}`;
            arbitrageDiv.appendChild(p);
        });
    } catch (error) {
        arbitrageDiv.textContent = "Error calculating arbitrage.";
    }
}

populateCurrencies();
