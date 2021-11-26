/**
 * The Original Repository Developer: https://github.com/dwass
 * Makecode BME680 gas sensor Package.
 */

enum BME680_T {
    //% block="C"
    T_C = 0,
    //% block="F"
    T_F = 1
}

enum BME680_P {
    //% block="Pa"
    Pa = 0,
    //% block="hPa"
    hPa = 1
}

/**
 * BME680 block
 */
//% weight=100 color=#a1709b icon="\uf042" block="EdUHK_BME680"
namespace EdUHK_BME680 {
    let BME680_I2C_ADDR = 0x77

    function setreg(reg: number, dat: number): void {
        let buf = pins.createBuffer(2);
        buf[0] = reg;
        buf[1] = dat;
        pins.i2cWriteBuffer(BME680_I2C_ADDR, buf);
    }

    function getreg(reg: number): number {
        pins.i2cWriteNumber(BME680_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME680_I2C_ADDR, NumberFormat.UInt8BE);
    }

    function getInt8LE(reg: number): number {
        pins.i2cWriteNumber(BME680_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME680_I2C_ADDR, NumberFormat.Int8LE);
    }

    function getUInt16LE(reg: number): number {
        pins.i2cWriteNumber(BME680_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME680_I2C_ADDR, NumberFormat.UInt16LE);
    }

    function getInt16LE(reg: number): number {
        pins.i2cWriteNumber(BME680_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME680_I2C_ADDR, NumberFormat.Int16LE);
    }

    function getUInt16BE(reg: number): number {
        pins.i2cWriteNumber(BME680_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME680_I2C_ADDR, NumberFormat.UInt16BE);
    }

    function setHeatConfig(target_temp: number): void {
        // Assume 25 degrees C is ambient temp
        let amb_temp = 25
        let var1 = ((amb_temp * par_g3) / 10) << 8 // div 10 or 1000? unclear!
        let var2 = (par_g1 + 784) * (((((par_g2 + 154009) * target_temp * 5) / 100) + 3276800) / 10)
        let var3 = var1 + (var2 >> 1)
        let var4 = (var3 / (res_heat_range + 4))
        let var5 = (131 * res_heat_val) + 65536
        let res_heat_x100 = (((var4 / var5) - 250) * 34)
        let res_heat_x = ((res_heat_x100 + 50) / 100)
        //serial.writeLine("res_heat_val: " + res_heat_val + ", res_heat_range: " + res_heat_range)
        //serial.writeLine("setheat g1: " + par_g1 + ",g2: " + par_g2 + ",g3: " + par_g3)
        //serial.writeLine("setheat v1: " + var1 + ",v2: " + var2 +
                //",v3: " + var3 + ",v4: " + var4 + ",v5: " + var5)
        //serial.writeLine("res_heat_x100: " + res_heat_x100 +
                //", res_heat_x: " + res_heat_x)
        // Set the value in res_heat_0
        setreg(0x5A, res_heat_x)
    }

    // constants for the gas conversion
    let const_array1_int = [2147483647, 2147483647, 2147483647, 2147483647, 2147483647, 
                            2126008810, 2147483647, 2130303777, 2147483647, 2147483647,
                            2143188679, 2136746228, 2147483647, 2126008810, 2147483647, 2147483647] 
    let const_array2_int = [4096000000, 2048000000, 1024000000, 512000000,
                            255744255, 127110228, 64000000, 32258064, 16016016, 8000000, 4000000, 2000000, 1000000, 500000, 250000,
                            125000]

    // BME680 stuff (signed/unsigned based on https://github.com/SV-Zanshin/BME680/blob/master/src/Zanshin_BME680.cpp)
    let par_t1 = getUInt16LE(0xE9)
    let par_t2 = getInt16LE(0x8A)
    let par_t3 = getInt8LE(0x8C)

    let par_p1 = getUInt16LE(0x8E)
    let par_p2 = getInt16LE(0x90)
    let par_p3 = getInt8LE(0x92)
    let par_p4 = getInt16LE(0x94)
    let par_p5 = getInt16LE(0x96)
    let par_p6 = getInt8LE(0x99)
    let par_p7 = getInt8LE(0x98)
    let par_p8 = getInt16LE(0x9C)
    let par_p9 = getInt16LE(0x9E)
    let par_p10 = getreg(0xA0)

    let e2 = getreg(0xE2) >> 4
    let par_h1 = (getInt8LE(0xE3) << 4) | e2
    let par_h2 = (getInt8LE(0xE1) << 4) | e2
    let par_h3 = getInt8LE(0xE4)
    let par_h4 = getInt8LE(0xE5)
    let par_h5 = getInt8LE(0xE6)
    let par_h6 = getreg(0xE7)
    let par_h7 = getInt8LE(0xE8)
    
    let par_g1 = getInt8LE(0xED)
    let par_g2 = getInt16LE(0xEB)
    let par_g3 = getInt8LE(0xEE)
    let res_heat_val = getInt8LE(0x00)
    // heat range is in bits 5:4 of reg 0x02
    let res_heat_range = (getreg(0x02) & 0x30) >> 4

    let T = 0
    let P = 0
    let H = 0
    let H_decimal = 0
    let G = 0
    let G_decimal = 0

    function get(): void {
        //serial.writeLine("get()")

        // Set oversampling H to 1x
        setreg(0x72, 0x01)
        // Set oversampling T to 2x and P to 16x
        setreg(0x74, 0x54)
        // Gas setup
        // Use 100ms heat time
        setreg(0x64, 0x59)
        // Set heat set point to 300 deg. C
        setHeatConfig(300)
        // Set to use heat time 0
        setreg(0x71, 0x00)
        // Enable gas reading
        setreg(0x71, 0x10)
        // Trigger single measurement in force mode
        setreg(0x74, getreg(0x74) | 0x01)

        // Now wait until the measurement is completed and the values area available for reading
        // Read the status register every 50msec. Give up after 500msec
        let i = 0;
        for (i = 0; i < 10; i++) {
            basic.pause(50)
            let eas_status = getreg(0x1D)
            //serial.writeLine("status: " + eas_status)
            if ((eas_status & 0x80) != 0) {
                // New data bit is set, stop waiting
                break
            }
        }
    
        // BME680 stuff
        // Get raw temperature value
        let temp_adc = (getreg(0x22) << 12) | (getreg(0x23) << 4) | (getreg(0x24) >> 4)
        // Convert temperature
        let var1 = (temp_adc >> 3) - (par_t1 << 1)
        let var2 = (var1 * par_t2) >> 11
        let var3 = ((((var1 >> 1) * (var1 >> 1)) >> 12) * (par_t3 << 4)) >> 14
        let t_fine = var2 + var3
        let temp_comp = ((t_fine * 5) + 128) >> 8
        //serial.writeLine("Temp: " + temp_comp)
        //T = Math.idiv(temp_comp, 100)
        T = temp_comp / 100

        // Get raw pressure value
        let press_raw = (getreg(0x1F) << 12) | (getreg(0x20) << 4) | (getreg(0x21) >> 4)
        // convert Pressure value to Pascal
        var1 = (t_fine >> 1) - 64000
        var2 = ((((var1 >> 2) * (var1 >> 2)) >> 11) * par_p6) >> 2
        var2 = var2 + ((var1 * par_p5) << 1)
        var2 = (var2 >> 2) + (par_p4 << 16)
        var1 = (((((var1 >> 2) * (var1 >> 2)) >> 13) * (par_p3 << 5)) >> 3) + ((par_p2 * var1) >> 1)
        var1 = var1 >> 18
        var1 = ((32768 + var1) * par_p1) >> 15
        let press_comp = 1048576 - press_raw
        press_comp = (press_comp - (var2 >> 12)) * 3125
        if (var1 == 0)
            return; // avoid divide by zero exception
        if (press_comp >= (1 << 30))
            press_comp = ((press_comp / var1) << 1)
        else
            press_comp = ((press_comp << 1) / var1)
        var1 = (par_p9 * (((press_comp >> 3) * (press_comp >> 3)) >> 13)) >> 12
        var2 = ((press_comp >> 2) * par_p8) >> 13
        var3 = ((press_comp >> 8) * (press_comp >> 8) * (press_comp >> 8) * par_p10) >> 17
        press_comp = (press_comp) +  ((var1 + var2 + var3 + (par_p7 << 7)) >> 4)
        P = press_comp
        //serial.writeLine("Pressure: " + press_comp)

        // Get humidity value
        let hum_adc = getUInt16BE(0x25)
        //serial.writeLine("0x25: " + getreg(0x25) + "/0x26: " + getreg(0x26))
        //serial.writeLine("hum_adc: " + hum_adc + ", temp_scaled: " + temp_comp)
        // Convert humidity value
        let temp_scaled = temp_comp
        var1 = hum_adc - (par_h1 << 4) - (((temp_scaled * par_h3) / 100) >> 1)
        var2 = (par_h2 * (((temp_scaled * par_h4) / 100) + (((temp_scaled * ((temp_scaled * par_h5) /100)) >> 6) / 100) + (1 << 14))) >> 10
        var3 = var1 * var2
        let var4 = ((par_h6 << 7) + ((temp_scaled * par_h7) / 100)) >> 4
        let var5 = ((var3 >> 14) * (var3 >> 14)) >> 10
        let var6 = (var4 * var5) >> 1
        let hum_comp = (((var3 + var6) >> 10) * 1000) >> 12
        H = hum_comp
        //serial.writeLine("Humidity: " + hum_comp)

        let HInt = Math.idiv(H, 1000)
        let HRemainder = Math.idiv((H % 1000), 100)

        let HTemp = HInt + "." + HRemainder
        H_decimal = parseFloat(HTemp)

        // Get gas data value
        let gas_2b = getreg(0x2B)
        //serial.writeLine("0x2b: " + gas_2b)
        // Check status of reading
        let gas_valid = (gas_2b & 0x20) != 0
        let heat_stab = (gas_2b & 0x10) != 0
        //serial.writeLine("gas_valid: " + gas_valid + "/heat_stab: " + heat_stab)
        let gas_adc = (getreg(0x2A) << 2) | (gas_2b >> 6)
        let gas_range = gas_2b & 0x0F
        let range_switching_error = getreg(0x04) >> 4
        //serial.writeLine("gas_adc: " + gas_adc + "/gas_range : " + gas_range + "/sw_error: " + range_switching_error)
        // Convert gas data
        let fvar1 = (((1340.0 + (5 * range_switching_error)) * (const_array1_int[gas_range])) / 65536.0)
        //serial.writeLine("var1: " + fvar1)

        let fvar2 = (gas_adc << 15) - (1 << 24) + fvar1

        let xxx = (const_array2_int[gas_range] * fvar1)
        let yyy = xxx / 512.0
        let zzz = fvar2 / 2.0
        let gas_res = (yyy + zzz) / fvar2
        //serial.writeLine("xxx: " + xxx + ",yyy: " + yyy + ",zzz: " + zzz)
        G = gas_res
        //serial.writeLine("Gas: " + gas_res) 
        //+ "/var1: " + fvar1 + "/var2: " + fvar2)
        serial.writeLine("===== PROCESSED DATA =====") 

        let GInt = Math.idiv(G, 1000)
        let GRemainder = G % 100

        let GTemp = GInt + "." + GRemainder
        G_decimal = parseFloat(GTemp)


    }

    /**
     * get pressure
     */
    //% blockId="BME680_GET_PRESSURE" block="pressure %u"
    //% weight=80 blockGap=8
    export function pressure(u: BME680_P): number {
        get();
        if (u == BME680_P.Pa) return P;
        //else return Math.idiv(P, 100)
        else return (P / 100);
    }

    /**
     * get temperature
     */
    //% blockId="BME680_GET_TEMPERATURE" block="temperature %u"
    //% weight=80 blockGap=8
    export function temperature(u: BME680_T): number {
        get();
        if (u == BME680_T.T_C) return T;
        else return 32 + Math.idiv(T * 9, 5)
    }

    /**
     * get humidity
     */
    //% blockId="BME680_GET_HUMIDITY" block="humidity"
    //% weight=80 blockGap=8
    export function humidity(): number {
        get();
        return H_decimal;
    }

    /**
     * get gas
     */
    //% blockId="BME680_GET_GAS" block="gas"
    //% weight=80 blockGap=8
    export function gas(): number {
        get();
        return G_decimal;
    }

    /**
     * power on
     */
    //% blockId="BME680_POWER_ON" block="Power On"
    //% weight=22 blockGap=8
    export function PowerOn() {
        setreg(0xF4, 0x2F)
    }

    /**
     * power off
     */
    //% blockId="BME680_POWER_OFF" block="Power Off"
    //% weight=21 blockGap=8
    export function PowerOff() {
        setreg(0xF4, 0)
    }

    /**
     * Calculate Dewpoint
     */
    //% block="Dewpoint"
    //% weight=60 blockGap=8
    export function Dewpoint(): number {
        get();
        return T - Math.idiv(100 - H, 5)
    }

    /**
     * Pressure below Event
     */
    //% block="Pressure below than %dat" dat.defl=100000
    export function PressureBelowThan(dat: number, body: () => void): void {
        control.inBackground(function () {
            while (true) {
                get()
                if (P < dat) {
                    body()
                }
                basic.pause(1000)
            }
        })
    }

    /**
     * Pressure higher Event
     */
    //% block="Pressure higher than %dat" dat.defl=100000
    export function PressureHigherThan(dat: number, body: () => void): void {
        control.inBackground(function () {
            while (true) {
                get()
                if (P > dat) {
                    body()
                }
                basic.pause(1000)
            }
        })
    }

    /**
     * humidity below Event
     */
    //% block="Humidity below than %dat" dat.defl=10
    export function HumidityBelowThan(dat: number, body: () => void): void {
        control.inBackground(function () {
            while (true) {
                get()
                if (H < dat) {
                    body()
                }
                basic.pause(1000)
            }
        })
    }

    /**
     * humidity higher Event
     */
    //% block="Humidity higher than %dat" dat.defl=50
    export function HumidityHigherThan(dat: number, body: () => void): void {
        control.inBackground(function () {
            while (true) {
                get()
                if (H > dat) {
                    body()
                }
                basic.pause(1000)
            }
        })
    }

    /**
     * temperature below Event
     */
    //% block="Temperature below than %dat" dat.defl=10
    export function TemperatureBelowThan(dat: number, body: () => void): void {
        control.inBackground(function () {
            while (true) {
                get()
                if (T < dat) {
                    body()
                }
                basic.pause(1000)
            }
        })
    }

    /**
     * temperature higher Event
     */
    //% block="Temperature higher than %dat" dat.defl=30
    export function TemperatureHigherThan(dat: number, body: () => void): void {
        control.inBackground(function () {
            while (true) {
                get()
                if (T > dat) {
                    body()
                }
                basic.pause(1000)
            }
        })
    }
}  
