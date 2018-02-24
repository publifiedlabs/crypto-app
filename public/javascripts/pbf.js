if (window.location.pathname == '/users/currencies') {
// Get the HTTP Header Request for CryptoCompare API
const request = new XMLHttpRequest();
request.onreadystatechange = function cryptoConverter() {
    if (request.readyState === 4) {
        if (request.status === 200) {
            document.body.className = 'ok';
            // Putting the outcome of the HTTP request into a Variable
            const currencyUSD = JSON.parse(request.responseText);
            // For each indivdual currency value in USD
            const XRPUSD = currencyUSD.XRP.USD;
            const ETHUSD = currencyUSD.ETH.USD;
            const BTCUSD = currencyUSD.BTC.USD;
            const XMRUSD = currencyUSD.XMR.USD;
            const XLMUSD = currencyUSD.XLM.USD;
            const LTCUSD = currencyUSD.LTC.USD;
            const DRGNUSD = currencyUSD.DRGN.USD;
            const BCHUSD = currencyUSD.BCH.USD;
            const ADAUSD = currencyUSD.ADA.USD;
            // This function integrates the currency value with the index.html
            const getCurrencyIdToSet = (id, value) => {
                if(document.getElementById(id) !== null) {
                    document.getElementById(id).innerHTML = value;
                }
            }
            getCurrencyIdToSet('XRPUSDVAL', XRPUSD);
            getCurrencyIdToSet('ETHUSDVAL', ETHUSD);
            getCurrencyIdToSet('BTCUSDVAL', BTCUSD);
            getCurrencyIdToSet('XMRUSDVAL', XMRUSD);
            getCurrencyIdToSet('XLMUSDVAL', XLMUSD);
            getCurrencyIdToSet('LTCUSDVAL', LTCUSD);
            getCurrencyIdToSet('DRGNUSDVAL', DRGNUSD);
            getCurrencyIdToSet('BCHUSDVAL', BCHUSD);
            getCurrencyIdToSet('ADAUSDVAL', ADAUSD);
            // This grabs the Currency Types
            let currencyType = document.getElementsByClassName("pbfCurrencyType");
                Array.from(currencyType).forEach(currency => {
                    let prefix = currency.innerHTML;
                    let node = document.getElementById(`${prefix}USDVAL`).textContent * document.getElementById(`${prefix}USDAMT`).value;
                    let total = node.toFixed(2);
                    document.getElementById(`${prefix}USDTOTAL`).innerHTML = total;
                });
        } else if (!isValid(this.response) && this.status == 0) {
            document.body.className = 'error offline';
            console.log("The computer appears to be offline.");                
        } else {
            document.body.className = 'error';
        }
    }
};
request.open("GET", 'https://min-api.cryptocompare.com/data/pricemulti?fsyms=XRP,ETH,BTC,XMR,XLM,LTC,DRGN,BCH,ADA&tsyms=USD' , true);
request.send(null);
}
