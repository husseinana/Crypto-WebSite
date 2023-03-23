/// <reference path="./jquery-3.6.3.js" />
/// <reference path="./Utils.js" />

const binanceAPIURL = "https://api.binance.com/api/v3/avgPrice?symbol="
const binanceAPIKey = "JFm4ObCJOPX6QKQdYgHCnQF97GSz8X5mSzFxgPN4vf5kdmUGbC1v7icqvtsd3XTI"
const binanceAPISecKey = "4WUxOHnQ1kw0438c2xnDhE6gD4fDnlbEh7q3vxck0lGvCOcBW3d6U3dKye3fgSxJ"


const TickerURL = "https://api.coinpaprika.com/v1/tickers";
const CoinListURL = "https://api.coinpaprika.com/v1/coins"
const OHLCTodayURL = "https://api.coinpaprika.com/v1/coins/btc-bitcoin/ohlcv/today"
const numOfCoins = 10
const totalCoins = 10


const CurrencyConverterURL = "https://api.freecurrencyapi.com/v1/latest?apikey=vnH5ObV9xVdtrYnYiFq1WkmhLaUfFmC43Cv6BqbW"

let coinListArray;
let coinInfoArray = [];
let tickerArray = [];
let tickerArrayLastDay = []
let tickerArrayBinance = []
let refreshIntervalID;
let lineChartRef = null
let CurrArr = null
let currencySelected = "USD"

const COLORS = [
    '#4dc9f6',
    '#f67019',
    '#f53794',
    '#537bc4',
    '#acc236',
    '#166a8f',
    '#00a950',
    '#58595b',
    '#8549ba',
    ''
];

let colorMap = [];

const labels = ['12PM', '1AM', '2AM', '3AM', '4AM', '5AM', '6AM', '7AM', '8AM', '9AM', '10AM', '11AM', '12AM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM', '10PM', '11PM'];
const favIconEmpty = `<i class="bi bi-star"></i>`

const favIconFill = `<i class="bi bi-star-fill"></i>`

$(() => {
    websiteInit();
    eventInit();
})

function eventInit() {
    $(document).on("click", "#chartsBtn", CompareCoins);
    $(document).on("click", "#chartsBtnLive", CompareCoinsBinance);
    $(document).on("click", "#allCoins", AllCoins);
    $(document).on("click", "#gainersCoins", WinnerCoins);
    $(document).on("click", "#losersCoins", LoserCoins);
    $(document).on("click", "#allBtn", CheckAll);
    $(document).on("click", ".favCoin", FavCoinsClick);
    $(document).on("click", "#favCoins", FavCoins);
    $(document).on("click", ".hideCoin", DeleteCoin);

    $(document).on("click", "#USD", ChangeCurrency);
    $(document).on("click", "#EUR", ChangeCurrency);
    $(document).on("click", "#ILS", ChangeCurrency);

    $(".aboutection").hide()
}
function ChangeCurrency() {
    let id = $(this).attr("id");
    currencySelected = id;

    $("#USD").css("color", "#061a40")
    $("#EUR").css("color", "#061a40")
    $("#ILS").css("color", "#061a40")
    $(this).css("color", "white")

    let cksIds = []
    $('input:checked').each(function () {
        var $this = $(this);
        if ($this.is(":checked"))
            cksIds.push($this.attr("name"));
    });

    DrawMainTable();
    distroyChart("chartsSection")
    for (let x of cksIds) {
        $('[name="' + x + '"]').attr('checked', 'checked');
    }
}
function GetCurrencyFactor() {
    if (currencySelected == "USD")
        return 1;
    else if (currencySelected == "EUR")
        return CurrArr.data["EUR"]
    else if (currencySelected == "ILS")
        return CurrArr.data["ILS"]

}

function GetCurrencySymbol() {
    if (currencySelected == "USD")
        return "&#36;";
    else if (currencySelected == "EUR")
        return "&euro;"
    else if (currencySelected == "ILS")
        return "&#8362;"
}



function FormatCurrency(num) {
    return (num * GetCurrencyFactor()).toFixed(2)
}

function DeleteCoin() {
    let tr = $(this).closest("tr")

    var name = tr.find("td:eq(3)").text(); // get current row 3rd TD
    let coinToBeRemoved = ""
    // console.log(name)
    for (const coin of coinInfoArray) {
        if (coin.coinInfo.name == name) {
            coinToBeRemoved = coin
        }
    }

    const index = coinInfoArray.indexOf(coinToBeRemoved);

    const x = coinInfoArray.splice(index, 1);

    removeColor(coinToBeRemoved.coinInfo.name)

    addToLocalStorage("CoinInfoArray", coinInfoArray);
    $(this).closest('tr').remove();
}

function FavCoinsClick() {

    let tr = $(this).closest("tr")

    if (!tr.hasClass("fav"))
        tr.addClass("fav")
    else
        tr.removeClass("fav")

    let i = $(this).children('i')

    if (i.hasClass("bi-star-fill"))
        i.removeClass("bi-star-fill").addClass("bi-star")
    else
        i.removeClass("bi-star").addClass("bi-star-fill")

    var name = tr.find("td:eq(3)").text(); // get current row 3rd TD
    for (const coin of coinInfoArray) {
        if (coin.coinInfo.name == name) {
            coin.fav = !coin.fav;
        }
    }

    addToLocalStorage("CoinInfoArray", coinInfoArray);
}
function CheckAll() {
    if ($('#allBtn')[0].innerText == "All") {
        $('input:checkbox').prop('checked', true);
        $('#allBtn')[0].innerText = "None"
    }
    else {
        $('input:checkbox').prop('checked', false);
        $('#allBtn')[0].innerText = "All"
    }

}

function AllCoins() {
    $(".allcoins").show();
} function WinnerCoins() {
    $(".allcoins").hide();
    $(".winner").show();
} function LoserCoins() {
    $(".allcoins").hide();
    $(".loser").show();
}
function FavCoins() {
    $(".allcoins").hide();
    $(".fav").show();
}


function CompareCoins() {

    var selected = [];
    if ($('input:checked').length == 0) {
        document.getElementById('errorMsg').innerHTML = 'Please select up to 5 coins to comapre ! '
        document.getElementById('errorModal').style.display = 'block'
        return
    }

    if ($('input:checked').length > 5) {
        document.getElementById('errorMsg').innerHTML = 'Please select maximum 5 coins to compare ! '
        document.getElementById('errorModal').style.display = 'block'
        return
    }

    clearInterval(refreshIntervalID);

    tickerArrayLastDay = []
    $('input:checked').each(async function () {
        await GetHistoricalData($(this).attr('name'), $(this).attr('symname')).then(() => drawCharts())
        //  drawChartMultiAxis()).then(() => DrawBarChart())
    });



}
function CompareCoinsBinance() {

    if ($('input:checked').length == 0) {
        document.getElementById('errorMsg').innerHTML = 'Please select up to 5 coins to comapre ! '
        document.getElementById('errorModal').style.display = 'block'
        return
    }

    if ($('input:checked').length > 5) {
        document.getElementById('errorMsg').innerHTML = 'Please select maximum 5 coins to compare ! '
        document.getElementById('errorModal').style.display = 'block'
        return
    }
    lineChartRef = null
    distroyChart("chartsSection")
    hideChart();
    // $("#ChartsModal").css("display","block");

    tickerArrayBinance = []
    clearInterval(refreshIntervalID);
    refreshIntervalID = setInterval(
        CompareCoinsBinanceAPI, 2000
    )
    showChart();

}

async function CompareCoinsBinanceAPI() {

    let time = Date.now()

    $('input:checked').each(async function () {
        let coinID = $(this).attr('symname');
        if (coinID != "USDT")
            fetch(binanceAPIURL + coinID + 'USDT',
                {
                    method: "GET",
                    withCredentials: true,
                    headers: {
                        // "CryptoWorldAPI": binanceAPIKey,
                        // "Content-Type": "application/json"
                    }
                },
                mode = "no-cors"
            )
                .then(r => r.json())
                .then(function (j) {
                    let p = parseFloat(j.price).toFixed(2);
                    // let y = { coinID, p }
                    // let t = tickerArrayBinance.find(x => x.time == time)
                    // if (t == null)
                    //     tickerArrayBinance.push({ time: time, value: [y] })
                    // else
                    //     t.value.push(y)

                    //console.log(time + " : " + coinID + " : " + p)

                    let curObj = tickerArrayBinance.find(x => x.coin == coinID)
                    if (curObj == null)
                        tickerArrayBinance.push({ coin: coinID, prices: [{ time: time, price: p }] })
                    else
                        curObj.prices.push({ time: time, price: p })
                }
                )
                .then(() => drawChartsLive())
                // .then(()=> showChart())
                .catch(k => console.log(Date.now() + " : Error fetching coin (" + coinID + ") Coin dose not exist in Binance API" + k.message))

    });
}
async function drawChartsLive() {
    drawChartMultiAxisLive();
    //document.getElementById('chartsSectionLive').scrollIntoView();
    //DrawBarChart()
}

async function drawCharts() {
    drawChartMultiAxis();
    document.getElementById('chartsSectiondiv').scrollIntoView();
    //DrawBarChart()
}
async function GetHistoricalData(coinid, symname) {
    console.log("GetHistoricalData..." + coinid)
    const today = new Date();
    let month = (today.getMonth() + 1).toString()
    let day = today.getDate().toString()

    if (month.length == 1)
        month = "0" + month

    if (day.length == 1)
        day = "0" + day

    let todayFormat = `${today.getFullYear()}-${month}-${day}`
    let url = `${TickerURL}/${coinid}/historical?start=${todayFormat}&interval=1h`
    // console.log(url)

    let response = await fetch(url)
    let data = await response.json();

    if (data == null) //Use Last Day 
    {
        todayFormat = `${today.getFullYear()}-${month}-${day - 1}`
        url = `${TickerURL}/${coinid}/historical?start=${todayFormat}&interval=1h`
        // console.log(url)
        response = await fetch(url)
        data = await response.json();
    }
    tickerArrayLastDay.push({ coinid: coinid, symname: symname, data: data })
}


// Main function to start the website needed functions
async function websiteInit() {
    console.log("websiteInit...")
    $("body").css("cursor", "progress");

    hidePage()
    //RefreshData();
    RefreshData2();
    tickerArrayBinance = []

    await GetCurConArrayAsync()
}


function hidePage() {
    document.getElementById("mainTableSection").style.display = "none";
    document.getElementById("loader").style.display = "block";
}

function showPage() {
    setTimeout(() => {
        document.getElementById("loader").style.display = "none";
        document.getElementById("mainTableSection").style.display = "block";
    },
        1000)
}


function hideChart() {
    document.getElementById("chartsSectiondiv").style.display = "none";
    document.getElementById("loader-chart").style.display = "block";
}
function showChart() {
    setTimeout(() => {
        document.getElementById("loader-chart").style.display = "none";
        document.getElementById("chartsSectiondiv").style.display = "block";
    },
        2000)
    setTimeout(() => {
        document.getElementById('chartsSectiondiv').scrollIntoView();
    },
        3000)


}

function RefreshData() {
    GetCoinListArray("CoinListArray", GetCoinListArrayAsync)
        .then(() => GetCoinInfoArray("CoinInfoArray", GetCoinInfoArrayAsync))
        .then(() => GetTickers())
        .then(() => DrawMainTable());
}

//  Check if we do have already a localstorage data
async function GetCoinListArray(nameInLocalStorage, callback) {
    console.log("GetCoinListArray...")

    const dataInLocalStorage = localStorage.getItem(nameInLocalStorage);
    if (dataInLocalStorage) {
        const dataInJson = JSON.parse(dataInLocalStorage);
        coinListArray = dataInJson;
    }
    else {
        await callback()
    }
}

async function GetCoinListArrayAsync() {
    console.log("GetCoinListArrayAsync...")

    const response = await fetch(CoinListURL)
    const data = await response.json();
    const coinListArr = data.filter(a => a.rank >= 1 && a.rank <= 100);
    coinListArray = coinListArr;
    addToLocalStorage("CoinListArray", coinListArr);
}

async function GetCurConArrayAsync() {
    console.log("GetCurConArrayAsync...")
    CurrArr = { data: { EUR: 0.93, ILS: 3.65 } }
    try {
        const response = await fetch(CurrencyConverterURL)
        CurrArr = await response.json();
    }
    catch {
        CurrArr = { data: { EUR: 0.93, ILS: 3.65 } }
    }
    addToLocalStorage("CurrArr", CurrArr);
}


async function GetCoinInfoArrayAsync() {
    console.log("GetCoinInfoArrayAsync...")
    for (let i = 0; i < numOfCoins; i++) {
        await GetCoinInfoByID(coinListArray[i].id)
    }
    addToLocalStorage("CoinInfoArray", coinInfoArray);
}

async function GetCoinInfoArray(nameInLocalStorage, callback) {
    console.log("GetCoinInfoArray...")

    const dataInLocalStorage = localStorage.getItem(nameInLocalStorage);
    if (dataInLocalStorage) {
        const dataInJson = JSON.parse(dataInLocalStorage);
        coinInfoArray = dataInJson;
    }
    else {
        await callback()
    }
}

async function GetCoinInfoByID(id) {

    console.log("GetCoinInfoByID...")

    const coinInfo = await getCoinByID(id)
    const coinInfoOHLC = await getCoinOHLCByID(id)

    const itemObj = { id: id, coinInfo: coinInfo, coinInfoOHLC: coinInfoOHLC, fav: false }
    coinInfoArray.push(itemObj)
}

async function getCoinOHLCByID(id) {
    const response = await fetch(CoinListURL + "/" + id + "/ohlcv/today");
    const data = await response.json();
    return data;
}

async function getCoinByID(id) {
    const response = await fetch(CoinListURL + "/" + id);
    const data = await response.json();
    return data;
}


async function GetTickers() {
    console.log("GetTickers...")

    const response = await fetch(TickerURL)
    const data = await response.json();
    const coinListArr = data.filter(a => a.rank >= 1 && a.rank <= totalCoins);
    tickerArray = coinListArr
    addToLocalStorage("TickerArray", tickerArray);
}

function addToLocalStorage(nameInLocalStorage, coinListArr) {
    localStorage.setItem(nameInLocalStorage, JSON.stringify(coinListArr));
}


function DrawMainTable() {
    console.log("DrawMainTable")
    const myTableBody = document.getElementById("maintablebody")
    myTableBody.innerHTML = ""
    for (let i = 0; i < coinInfoArray.length; i++) {
        let coin = coinInfoArray[i]
        AddTableRow(coin)
    }
    $("body").css("cursor", "default");
    showPage()
}

function AddTableRow(coin) {
    console.log("AddTableRow")

    const myTableBody = document.getElementById("maintablebody")

    const coinID = coin.id;
    const change = coin.coinInfoOHLC[0].close - coin.coinInfoOHLC[0].open;
    const changePercent = (change / coin.coinInfoOHLC[0].open).toFixed(2)
    let changeClass = change > 0 ? "winner allcoins" : change < 0 ? "loser allcoins" : "nochange allcoins"
    let removeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="gray" class="bi bi-trash3" viewBox="0 0 16 16">
                        <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>
                    </svg>`

    let favIcon = ""

    if (coin.fav) {
        favIcon = favIconFill
        changeClass += " fav"
    }
    else {
        favIcon = favIconEmpty
    }
    let icn = ""

    if (change < 0)
        icn = `<i class="bi-arrow-down-right icon-red"></i>`
    else if (change > 0)
        icn = `<i class="bi-arrow-up-right icon-green"></i>`

    const html = `<td><input type="checkbox" class="chk" name="${coinID}" symname="${coin.coinInfo.symbol}"></td>
                <td><img src="${coin.coinInfo.logo}" alt="" width=24></td>
                <td>${coin.coinInfo.symbol}</td>
                <td>${coin.coinInfo.name}</td>
                <td>${GetCurrencySymbol()} ${nFormatter(FormatCurrency(coin.coinInfoOHLC[0].open), 2)}  </td>
                <td>${GetCurrencySymbol()} ${nFormatter(FormatCurrency(coin.coinInfoOHLC[0].close), 2)}</td>
                <td class="changeWithIcon"><p>${changePercent}% ${icn}</p></td>
                <td>${GetCurrencySymbol()} ${nFormatter(FormatCurrency(coin.coinInfoOHLC[0].market_cap), 2)}</td>
                <td>${GetCurrencySymbol()} ${nFormatter(FormatCurrency(coin.coinInfoOHLC[0].volume), 2)}</td>
                <td class="hideCoin">${removeIcon}</td>
                <td class="favCoin">${favIcon}</td>`
        ;

    const myCurrentRow = document.createElement("tr");
    myCurrentRow.setAttribute("class", changeClass)
    myCurrentRow.innerHTML = html

    myTableBody.appendChild(myCurrentRow)
}

function nFormatter(num, digits) {
    const lookup = [
        { value: 1, symbol: "" },
        { value: 1e3, symbol: "K" },
        { value: 1e6, symbol: "M" },
        { value: 1e9, symbol: "B" },
        { value: 1e12, symbol: "T" },
        { value: 1e15, symbol: "P" },
        { value: 1e18, symbol: "E" }
    ];
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    var item = lookup.slice().reverse().find(function (item) {
        return num >= item.value;
    });
    return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
}

function GetColor(coinid) {
    let color = colorMap.find(c => c.coinid == coinid)

    if (color != null)
        return color.color;
    for (let col of COLORS) {
        if (colorMap.find(c => c.color == col) == null) {
            colorMap.push({ coinid: coinid, color: col })
            return col;
        }
    }
}
function removeColor(coinid) {
    let color = colorMap.find(c => c.coinid == coinid)
    if (color != null) {
        colorMap.splice(colorMap.indexOf(coinTocolorBeRemoved), 1);
    }
}


function drawChart() {

    let dataSets = []
    let idx = 0
    for (const coin of tickerArrayLastDay) {
        const locDataSet = coin.data.map(c => c.price)
        var randomColor = GetColor(coin.symname)

        const dsObj =
        {
            data: locDataSet,
            label: coin.coinid,
            borderColor: randomColor,
            backgroundColor: randomColor,
            fill: false
        }

        dataSets.push(dsObj)
        idx++;
        if (idx > 7)
            idx = 0
    }
    //console.log(dataSets)

    distroyChart("chartsSection2")

    new Chart(document.getElementById("chartsSection2"), {
        type: 'line',
        data: {
            labels: labels,
            datasets: dataSets
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'Compare Coins - Single Axis'
                }
            },
        }
    });
}

function distroyChart(id) {
    let chartStatus = Chart.getChart(id); // <canvas> id
    if (chartStatus != undefined) {
        chartStatus.destroy();
    }
}

function drawChartMultiAxis() {
    const datasets = []
    const scales = {}
    let y = 0
    let idx = 0
    for (const coin of tickerArrayLastDay) {
        const locDataSet = coin.data.map(c => FormatCurrency(c.price))
        var randomColor = GetColor(coin.symname);

        const dsObj =
        {
            label: coin.coinid,
            data: locDataSet,
            borderColor: randomColor,
            backgroundColor: randomColor,
            yAxisID: coin.coinid,
        }

        datasets.push(dsObj)
        scales[coin.coinid] = {
            type: 'linear',
            display: true,
            position: 'right',
            title: { text: coin.coinid },
            grid: {
                drawOnChartArea: false, // only want the grid lines for one axis to show up
            },
            ticks: {
                fontColor: randomColor,
                color: randomColor
            }
        }

        // if (y == 0) {
        //     scales[coin.coinid] = {
        //         type: 'linear',
        //         display: true,
        //         position: 'right',
        //         title: { text: coin.coinid },
        //         ticks: {
        //             fontColor: randomColor,
        //             color:randomColor
        //         }
        //     }
        // }
        // else {
        //     scales[coin.coinid] = {
        //         type: 'linear',
        //         display: true,
        //         position: 'right',
        //         title: { text: coin.coinid },
        //         grid: {
        //             drawOnChartArea: false, // only want the grid lines for one axis to show up
        //         },
        //         ticks: {
        //             fontColor: randomColor,
        //             color:randomColor
        //         }
        //     }
        // }
        // y++;
        // idx++;
        // if (idx > 7)
        //     idx = 0
    }

    const data = {
        labels: labels,
        datasets: datasets
    };

    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            stacked: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Compare Coins - Last 24 Hours - ' + currencySelected
                }
            },
            scales: scales
        },
    };

    distroyChart("chartsSection")
    lineChartRef = null;
    new Chart(document.getElementById("chartsSection"), config);
}


function drawChartMultiAxisLive() {


    let labels = [];
    let datasets = [];
    let scales = {}

    if (lineChartRef != null) {
        labels = lineChartRef.data.labels
        datasets = lineChartRef.data.datasets;
    }


    for (const coin of tickerArrayBinance) {
        // labels = coin.prices.map(c => c.time)

        // const locDataSet = coin.prices.map(c => c.price)
        var randomColor = GetColor(coin.coin);
        for (const t of coin.prices.map(c => c.time)) {
            let ttt = new Date(t);
            let tt = ttt.getHours() + ":" + ttt.getMinutes() + ":" + ttt.getSeconds();
            if (!labels.includes(tt))
                labels.push(tt)
        }

        let locDataSet = datasets.find(c => c.label == coin.coin)
        // console.log(locDataSet)

        if (locDataSet != null) {
            // locDataSet.data.push(coin.prices[coin.prices.length - 1].price)
            locDataSet.data.push(FormatCurrency(coin.prices[coin.prices.length - 1].price))
            // console.log(locDataSet)
        }
        else {
            locDataSet = []
            locDataSet.push(FormatCurrency(coin.prices[coin.prices.length - 1].price))
            const dsObj =
            {
                label: coin.coin,
                data: locDataSet,
                borderColor: randomColor,
                backgroundColor: randomColor,
                yAxisID: coin.coin,
            }
            datasets.push(dsObj)
        }

        scales[coin.coin] = {
            type: 'linear',
            display: true,
            position: 'right',
            title: { text: coin.coin },
            grid: {
                drawOnChartArea: false, // only want the grid lines for one axis to show up
            },
            ticks: {
                fontColor: randomColor,
                color: randomColor
            }
        }


    }

    // console.log(scales)
    const data = {
        labels: labels,
        datasets: datasets
    };

    // console.log(data)

    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            stacked: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Live Coins Prices - ' + currencySelected
                }
            },
            scales: scales
        },
    };

    if (lineChartRef == null) {
        // distroyChart("chartsSectionLive")
        distroyChart("chartsSection")

        // new Chart(document.getElementById("chartsSectionLive"), config);
        lineChartRef = new Chart(document.getElementById("chartsSection"), config);
    }
    else {
        // lineChartRef
        lineChartRef.data.labels = labels;
        lineChartRef.data.datasets = datasets;
        lineChartRef.options = config.options;
        lineChartRef.update();
    }
}

function DrawBarChart() {

    let dataSets = []
    let backgroundColor = []
    let labels = []
    let idx = 0
    for (const coin of tickerArrayLastDay) {
        const locDataSet = coin.data[coin.data.length - 1].price
        dataSets.push(locDataSet)

        var randomColor = GetColor(coin.symname);
        backgroundColor.push(randomColor)

        labels.push(coin.coinid)
        idx++;
        if (idx > 7)
            idx = 0
    }
    // console.log(dataSets)

    distroyChart("chartsSection2")

    new Chart(document.getElementById("chartsSection2"), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Coin Last Price",
                    backgroundColor: backgroundColor,
                    data: dataSets
                }
            ]
        },
        options: {
            legend: { display: false },
            title: {
                display: true,
                text: 'Coin Last Price'
            }
        }
    });
}

function createCoinCardBySearch() {
    if (document.getElementById("searchInputId").value == "")
        document.getElementById("searchList").style.display = "none"
    else {
        document.getElementById("searchList").style.display = "inline-block"
        document.getElementById("searchList").scrollTop = 0;

    }

    const newArray = coinListArray.filter(item => item.name.toUpperCase().includes(document.getElementById("searchInputId").value.toUpperCase()))
    const coinInfoList = coinInfoArray.map(i => i.id);

    const coinsToDraw = newArray.filter(i => !coinInfoList.includes(i.id))
    let html = ""
    // console.log(coinsToDraw)

    for (let c of coinsToDraw) {
        html += `<li onclick="AddCoinToTable(this.id)" id="${c.id}" ><a>${c.name}</a></li>`
    }
    document.getElementById("searchList").innerHTML = html
}

async function AddCoinToTable(coinID) {
    closeList()
    hidePage()
    await GetCoinInfoByID(coinID)
    addToLocalStorage("CoinInfoArray", coinInfoArray)
    AddTableRow(coinInfoArray[coinInfoArray.length - 1])
    showPage()
}
function closeList() {
    document.getElementById("searchInputId").value = ""
    document.getElementById("searchList").style.display = "none"
}



//----------------------------------------

function RefreshData2() {
    const dataInLocalStorage1 = localStorage.getItem("CoinListArray");
    const dataInLocalStorage2 = localStorage.getItem("CoinInfoArray");
    const dataInLocalStorage3 = localStorage.getItem("TickerArray");

    if (dataInLocalStorage1 && dataInLocalStorage2 && dataInLocalStorage3) {
        coinListArray = JSON.parse(dataInLocalStorage1);
        coinInfoArray = JSON.parse(dataInLocalStorage2);
        tickerArray = JSON.parse(dataInLocalStorage3);
        DrawMainTable()
    }
    else {
        RefreshCoinArray2()
            .then(async (res) => await RefreshCoinInfoArray2(res))
            .then(async (res) => await RefreshTickersArray2(res))
            .then(() => DrawMainTable())
    }
}

async function RefreshCoinInfoArray2(res) {
    console.log("RefreshCoinInfoArray2...")
    // console.log("coinListArray2 length:" + res.length)
    for (let i = 0; i < numOfCoins; i++)
        await GetCoinInfoByID2(res[i].id)
    // return res
    //     .slice(0, numOfCoins)
    //     .map(async (c) => await GetCoinInfoByID2(c.id))

    // let promises = coinListArray.slice(0, numOfCoins).map(c => {
    //     GetCoinInfoByID2(c.id).then(Promise.resolve())
    // });
    //return promises.reduce(p => Promise.resolve())
    // return coinListArray.slice(0, numOfCoins).reduce((c) => GetCoinInfoByID2(c.id), Promise.resolve())

    //return Promise.all(promises);
}

async function GetCoinInfoByID2(id) {


    let arr1 = await getCoinByID2(id)
    let arr2 = await getCoinOHLCByID2(id)

    const itemObj = { id: id, coinInfo: arr1, coinInfoOHLC: arr2, fav: false }
    coinInfoArray.push(itemObj)
    addToLocalStorage("CoinInfoArray", coinInfoArray);

    // return new Promise((resolve, reject) => {
    //     let arr1;
    //     let arr2;
    //     getCoinByID2(id)
    //         .then((res1) => {
    //             arr1 = res1
    //             getCoinOHLCByID2(id, res1)
    //                 .then((res2) => arr2 = res2)
    //                 .then(() => {
    //                     const itemObj = { id: id, coinInfo: arr1, coinInfoOHLC: arr2, fav: false }
    //                     coinInfoArray.push(itemObj)
    //                     addToLocalStorage("CoinInfoArray", coinInfoArray);
    //                 })
    //                 resolve()
    //         });
    // })

}


async function getCoinOHLCByID2(id, res1) {
    return new Promise((resolve, reject) => {

        $.ajax({
            url: CoinListURL + "/" + id + "/ohlcv/today",
            headers: {
            },
            type: "GET",
            dataType: "json",
            data: {
            },
            success: function (result) {
                resolve(result, res1);
            },
            error: function () {
                console.log("Error in fetching Coin Info Array OHCB");
            }
        });
    }
    )

}

async function getCoinByID2(id) {
    return new Promise((resolve, reject) => {

        $.ajax({
            url: CoinListURL + "/" + id,
            headers: {
            },
            type: "GET",
            dataType: "json",
            data: {
            },
            success: function (result) {
                resolve(result);
            },
            error: function () {
                console.log("Error in fetching Coin Info Array ");
            }
        });
    }
    )
}


function RefreshCoinArray2() {
    return new Promise((resolve, reject) => {

        console.log("RefreshCoinArray2...")

        $.ajax({
            url: CoinListURL,
            headers: {
            },
            type: "GET",
            dataType: "json",
            data: {
            },
            success: function (result) {
                let coinListArr = result.filter(a => a.rank >= 1 && a.rank <= 100 && a.id != 'usdt-tether');
                coinListArray = coinListArr;
                addToLocalStorage("CoinListArray", coinListArr);
                resolve(coinListArr);
            },
            error: function () {
                console.log("Error in fetching Coin List Array ");
            }
        });
    });

}

async function RefreshTickersArray2(res) {
    console.log("RefreshTickersArray2...")
    return new Promise((resolve, reject) => {

        $.ajax({
            url: TickerURL,
            headers: {
            },
            type: "GET",
            dataType: "json",
            data: {
            },
            success: function (result) {
                const coinListArr = result.filter(a => a.rank >= 1 && a.rank <= totalCoins);
                tickerArray = coinListArr
                addToLocalStorage("TickerArray", tickerArray);
                resolve(result);
            },
            error: function () {
                console.log("Error in fetching Coin Info Array ");
            }
        });
    }
    )


}