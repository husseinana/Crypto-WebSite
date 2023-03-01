/// <reference path="./jquery-3.6.3.js" />
/// <reference path="./Utils.js" />


const TickerURL = "https://api.coinpaprika.com/v1/tickers";
const CoinListURL = "https://api.coinpaprika.com/v1/coins"
const OHLCTodayURL = "https://api.coinpaprika.com/v1/coins/btc-bitcoin/ohlcv/today"
const numOfCoins = 5
const totalCoins = 10

let coinListArray;
let coinInfoArray = [];
let tickerArray = [];
let tickerArrayLastDay = []
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
const labels = ['12PM', '1AM', '2AM', '3AM', '4AM', '5AM', '6AM', '7AM', '8AM', '9AM', '10AM', '11AM', '12AM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM', '10PM', '11PM'];
const favIconEmpty = `<i class="bi bi-star"></i>`

const favIconFill = `<i class="bi bi-star-fill"></i>`

$(() => {
    websiteInit();
    eventInit();
})

function eventInit() {
    $(document).on("click", "#chartsBtn", CompareCoins);
    $(document).on("click", "#allCoins", AllCoins);
    $(document).on("click", "#gainersCoins", WinnerCoins);
    $(document).on("click", "#losersCoins", LoserCoins);
    $(document).on("click", "#allBtn", CheckAll);
    $(document).on("click", ".favCoin", FavCoinsClick);
    $(document).on("click", "#favCoins", FavCoins);
    $(document).on("click", ".hideCoin", DeleteCoin);

    $(".aboutection").hide()
}
function DeleteCoin()
{
    let tr = $(this).closest("tr")

    var name = tr.find("td:eq(3)").text(); // get current row 3rd TD
    let coinToBeRemoved = ""
    console.log(name)
    for (const coin of coinInfoArray) {
        if (coin.coinInfo.name == name) {
            coinToBeRemoved = coin
        }
    }

    const index = coinInfoArray.indexOf(coinToBeRemoved);

    const x = coinInfoArray.splice(index, 1);

    addToLocalStorage("CoinInfoArray", coinInfoArray);
    $(this).closest('tr').remove();
}

function FavCoinsClick() {

    let tr = $(this).closest("tr")

    if (!tr.hasClass("fav"))
        tr.addClass("fav")
    else
        tr.removeClass("fav)")

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
    tickerArrayLastDay = []
    $('input:checked').each(async function () {
        await GetHistoricalData($(this).attr('name')).then(() => drawCharts())
        //  drawChartMultiAxis()).then(() => DrawBarChart())
    });
}

async function drawCharts() {
    drawChartMultiAxis();
    document.getElementById('chartsSectiondiv').scrollIntoView();
    //DrawBarChart()
}
async function GetHistoricalData(coinid) {
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
    console.log(url)

    let response = await fetch(url)
    let data = await response.json();

    if (data == null) //Use Last Day 
    {
        todayFormat = `${today.getFullYear()}-${month}-${day - 1}`
        url = `${TickerURL}/${coinid}/historical?start=${todayFormat}&interval=1h`
        console.log(url)
        response = await fetch(url)
        data = await response.json();
    }
    tickerArrayLastDay.push({ coinid, data })
}


// Main function to start the website needed functions
function websiteInit() {
    console.log("websiteInit...")
    RefreshData();
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
    const myTableBody = document.getElementById("maintablebody")
    myTableBody.innerHTML = ""
    for (let i = 0; i < coinInfoArray.length; i++) {
        let coin = coinInfoArray[i]

        AddTableRow(coin)
    }
}

function AddTableRow(coin) {
    const myTableBody = document.getElementById("maintablebody")

    const coinID = coin.id;
    const change = coin.coinInfoOHLC[0].close - coin.coinInfoOHLC[0].open;
    const changePercent = (change / coin.coinInfoOHLC[0].open).toFixed(2)
    let changeClass = change > 0 ? "winner allcoins" : change < 0 ? "loser allcoins" : "nochange allcoins"
    let removeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="gray" class="bi bi-trash3" viewBox="0 0 16 16">
                        <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>
                    </svg>`

    let favIcon = ""

    if (coin.fav)
    {
        favIcon = favIconFill
        changeClass += " fav"
    }
    else
    {
        favIcon = favIconEmpty
    }
    let icn = ""

    if (change < 0)
        icn = `<i class="bi-arrow-down-right icon-red"></i>`
    else if (change > 0)
        icn = `<i class="bi-arrow-up-right icon-green"></i>`

    const html = `<td><input type="checkbox" class="chk" name="${coinID}"></td>
                <td><img src="${coin.coinInfo.logo}" alt="" width=24></td>
                <td>${coin.coinInfo.symbol}</td>
                <td>${coin.coinInfo.name}</td>
                <td>${nFormatter(coin.coinInfoOHLC[0].open.toFixed(2), 2)}</td>
                <td>${nFormatter(coin.coinInfoOHLC[0].close.toFixed(2), 2)}</td>
                <td class="changeWithIcon"><p>${changePercent}% ${icn}</p></td>
                <td>${nFormatter(coin.coinInfoOHLC[0].market_cap.toFixed(2), 2)}</td>
                <td>${nFormatter(coin.coinInfoOHLC[0].volume.toFixed(2), 2)}</td>
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
        { value: 1e3, symbol: "k" },
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

function drawChart() {

    let dataSets = []
    let idx = 0
    for (const coin of tickerArrayLastDay) {
        const locDataSet = coin.data.map(c => c.price)
        var randomColor = COLORS[idx]

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
        const locDataSet = coin.data.map(c => c.price)
        var randomColor = COLORS[idx];

        const dsObj =
        {
            label: coin.coinid,
            data: locDataSet,
            borderColor: randomColor,
            backgroundColor: randomColor,
            yAxisID: coin.coinid,
        }

        datasets.push(dsObj)
        if (y == 0) {
            scales[coin.coinid] = {
                type: 'linear',
                display: true,
                position: 'left',
                title: { text: coin.coinid },
            }
        }
        else {
            scales[coin.coinid] = {
                type: 'linear',
                display: true,
                position: 'right',
                title: { text: coin.coinid },
                grid: {
                    drawOnChartArea: false, // only want the grid lines for one axis to show up
                },
            }
        }
        y++;
        idx++;
        if (idx > 7)
            idx = 0
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
                    text: 'Compare Coins - Multi Axis'
                }
            },
            scales: scales
        },
    };

    distroyChart("chartsSection")

    new Chart(document.getElementById("chartsSection"), config);
}


function DrawBarChart() {

    let dataSets = []
    let backgroundColor = []
    let labels = []
    let idx = 0
    for (const coin of tickerArrayLastDay) {
        const locDataSet = coin.data[coin.data.length - 1].price
        dataSets.push(locDataSet)

        var randomColor = COLORS[idx]
        backgroundColor.push(randomColor)

        labels.push(coin.coinid)
        idx++;
        if (idx > 7)
            idx = 0
    }
    console.log(dataSets)

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
    console.log(coinsToDraw)

    for (let c of coinsToDraw) {
        html += `<li onclick="AddCoinToTable(this.id)" id="${c.id}" ><a>${c.name}</a></li>`
    }
    document.getElementById("searchList").innerHTML = html
}

async function AddCoinToTable(coinID) {
    closeList()
    await GetCoinInfoByID(coinID)
    addToLocalStorage("CoinInfoArray", coinInfoArray)
    AddTableRow(coinInfoArray[coinInfoArray.length - 1])

}
function closeList() {
    document.getElementById("searchInputId").value = ""
    document.getElementById("searchList").style.display = "none"
}