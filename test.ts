let Pressure = 0
let Gas = 0
let Humidity = 0
let Temperature = 0
BME680.PowerOn()
basic.forever(function () {
    Temperature = BME680.temperature(BME680_T.T_C)
    Humidity = BME680.humidity()
    Gas = BME680.gas()
    Pressure = BME680.pressure(BME680_P.hPa)
    serial.writeLine("Temperature: " + Temperature + " C,")
    serial.writeLine("Humidity: " + Humidity + " %, ")
    serial.writeLine("Gas: " + Gas + " KOhms, ")
    serial.writeLine("Pressure: " + Pressure + " hPa")
    basic.pause(5000)
})
