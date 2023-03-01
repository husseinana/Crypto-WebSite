class DataModal {
    constructor() {
        this.CryptoObject = []
    }
}


class CryptoObject {
    constructor(name) {
        this.name = "Name"
        this.shortName = ""
        this.icon = ""
        this.price = 50
        this.change = 10
        this.chart = new Chart()
    }

}

class Chart {
    constructor() {
        this.xValues = []
        this.yValues = []

        for (let i = 0; i < 100; i++) {
            this.xValues.push(i)
            this.yValues.push(i*Math.random())
        }
    }

}



let Data = new DataModal()

let item = new CryptoObject()
item.name = "Bitcoin"
item.shortName = "BTC"
item.change = 10
item.price = 60000
item.icon = "./../assets/images/btc.png"
item.chart = new Chart()

Data.CryptoObject.push(item)

item = new CryptoObject()
item.name = "Ethereum"
item.shortName = "ETH"
item.change = 5
item.price = 5000
item.icon = "./../assets/images/eth.png"
item.chart = new Chart()

Data.CryptoObject.push(item)

item = new CryptoObject()
item.name = "Cardano"
item.shortName = "ADA"
item.change = 2
item.price = 1
item.icon = "./../assets/images/ada.png"
item.chart = new Chart()

Data.CryptoObject.push(item)



item = new CryptoObject()
item.name = "Solana"
item.shortName = "SOL"
item.change = 34
item.price = 50
item.icon = "./../assets/images/sol.png"
item.chart = new Chart()

Data.CryptoObject.push(item)

//console.log(Data)

