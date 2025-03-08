# Fórmulas Matemáticas en InterUnido.com

![InterUnido Logo](../assets/logo.jpg)

## Índice

1. [Introducción](#introducción)
2. [Operaciones de Venta](#operaciones-de-venta)
   - [Stage 1: Datos Iniciales](#stage-1-datos-iniciales-venta)
   - [Stage 2: Cálculo de Transacciones](#stage-2-cálculo-de-transacciones-venta)
   - [Stage 3: Resumen y Distribución](#stage-3-resumen-y-distribución-venta)
3. [Operaciones de Canje](#operaciones-de-canje)
   - [Stage 1: Datos Iniciales](#stage-1-datos-iniciales-canje)
   - [Stage 2: Cálculo de Transacciones](#stage-2-cálculo-de-transacciones-canje)
   - [Stage 3: Resumen y Distribución](#stage-3-resumen-y-distribución-canje)
4. [Cálculos Comunes](#cálculos-comunes)
   - [Montos Pendientes](#montos-pendientes)
   - [Redondeo](#redondeo)
5. [Glosario de Variables](#glosario-de-variables)

## Introducción

Este documento detalla las fórmulas matemáticas utilizadas en el sistema InterUnido.com para calcular los resultados de las operaciones de venta y canje de divisas. Cada tipo de operación se procesa en tres etapas (stages), cada una con sus propios cálculos específicos. Entender estas fórmulas es esencial para comprender cómo el sistema determina montos, comisiones, ganancias y su distribución.

## Operaciones de Venta

Las operaciones de venta implican la conversión de divisas extranjeras (como USD o EUR) a moneda local (Bs).

### Stage 1: Datos Iniciales Venta

En esta etapa se recopilan los datos básicos de la operación:

- **Cliente**: Identificación del cliente
- **Divisa**: Tipo de divisa (USD, EUR, etc.)
- **Monto Total**: Cantidad total de divisa a vender
- **Tasa Cliente**: Tasa de cambio acordada con el cliente (Bs por unidad de divisa)

No hay cálculos complejos en esta etapa, pero se establece:

```
montoTotal = valor ingresado por el usuario
```

Este valor se almacena como `originalTotalAmount` y se utiliza para calcular el monto pendiente en operaciones incompletas.

### Stage 2: Cálculo de Transacciones Venta

En esta etapa se realizan los cálculos principales para cada transacción individual:

#### 1. Cálculo del Monto Total en Bolívares

```
totalSaleBs = amount × sellingRate
```

Donde:
- `amount`: Monto de la transacción en divisa extranjera
- `sellingRate`: Tasa de venta en Bs por unidad de divisa

#### 2. Cálculo del Costo Base

```
bankFactor = COMMISSION_FACTORS[bankCommission]
effectiveRate = (officeRate > 0) ? officeRate : clientRate
commission = effectiveRate × bankFactor
baseCostBs = amount × commission
```

Donde:
- `bankCommission`: Comisión bancaria seleccionada (tiene un factor asociado)
- `officeRate`: Tasa de la oficina (si aplica)
- `clientRate`: Tasa acordada con el cliente
- `commission`: Tasa de comisión efectiva

#### 3. Cálculo de la Diferencia (Ganancia Bruta)

```
differenceBs = totalSaleBs - baseCostBs
```

#### 4. Cálculo de Comisiones Arbitrarias

Para cada comisión arbitraria:

```
commBs = differenceBs × (percentage / 100)
commForeign = commBs / sellingRate
totalArbitraryBs = suma de todas las commBs
```

Donde:
- `percentage`: Porcentaje de la comisión arbitraria
- `commBs`: Monto de la comisión en bolívares
- `commForeign`: Monto de la comisión en divisa extranjera

#### 5. Cálculo de la Diferencia Después de Comisiones

```
differenceAfterCommsBs = differenceBs - totalArbitraryBs
```

#### 6. Cálculo del Monto a Distribuir en Divisa

```
amountToDistributeForeign = (commission > 0) ? differenceAfterCommsBs / commission : 0
```

### Stage 3: Resumen y Distribución Venta

En esta etapa se calcula la distribución de ganancias entre las partes involucradas:

#### 1. Distribución entre Oficinas

```
officeFactor = (officeCount === 2) ? 0.5 : 1
officesTotal = amountToDistributeForeign × DISTRIBUTION_FACTORS.OFFICE

Si 'PZO' está seleccionada:
  distribution.PZO = officesTotal × officeFactor

Si 'CCS' está seleccionada:
  distribution.CCS = officesTotal × officeFactor
```

Donde:
- `officeCount`: Número de oficinas seleccionadas (0, 1 o 2)
- `DISTRIBUTION_FACTORS.OFFICE`: Factor de distribución para oficinas (constante)

#### 2. Distribución para Ejecutivo y Cliente

```
distribution.executive = amountToDistributeForeign × DISTRIBUTION_FACTORS.EXECUTIVE
distribution.clientProfit = amountToDistributeForeign × DISTRIBUTION_FACTORS.CLIENT
```

Donde:
- `DISTRIBUTION_FACTORS.EXECUTIVE`: Factor de distribución para ejecutivos (constante)
- `DISTRIBUTION_FACTORS.CLIENT`: Factor de distribución para clientes (constante)

#### 3. Cálculo de Totales Globales

```
totalAmount = suma de amount de todas las transacciones
totalSoldBs = suma de totalSaleBs de todas las transacciones
totalBaseCostBs = suma de baseCostBs de todas las transacciones
totalDifferenceBs = suma de differenceBs de todas las transacciones
totalArbitraryCommissionsBs = suma de totalArbitraryBs de todas las transacciones
totalDistributionForeign = {
  PZO: suma de distribution.PZO de todas las transacciones,
  CCS: suma de distribution.CCS de todas las transacciones,
  executive: suma de distribution.executive de todas las transacciones,
  clientProfit: suma de distribution.clientProfit de todas las transacciones
}
```

#### 4. Cálculo del Monto Pendiente

```
totalProcesado = suma de amount de todas las transacciones (previas y nuevas)
montoPendiente = originalTotalAmount - totalProcesado

Si montoPendiente < 0.01:
  montoPendiente = 0
```

## Operaciones de Canje

Las operaciones de canje implican el intercambio de divisas, ya sea interno (entre clientes) o externo (con otra entidad).

### Stage 1: Datos Iniciales Canje

En esta etapa se recopilan los datos básicos de la operación:

- **Cliente**: Identificación del cliente
- **Tipo de Canje**: Interno o Externo
- **Monto Total**: Cantidad total de divisa a canjear

```
montoTotal = valor ingresado por el usuario
```

### Stage 2: Cálculo de Transacciones Canje

En esta etapa se realizan los cálculos para cada transacción individual:

#### 1. Cálculo de la Diferencia (Ganancia)

```
costDec = costCommission / 100
saleDec = saleCommission / 100
difference = monto × (saleDec - costDec)
```

Donde:
- `monto`: Monto parcial de la transacción
- `costCommission`: Comisión de costo en porcentaje
- `saleCommission`: Comisión de venta en porcentaje
- `difference`: Diferencia (ganancia) de la transacción

### Stage 3: Resumen y Distribución Canje

En esta etapa se calcula el resumen global y la distribución de ganancias:

#### 1. Cálculo de Totales

```
totalParcial = suma de monto de todas las transacciones (previas y nuevas)
totalDiferencia = suma de difference de todas las transacciones (previas y nuevas)
```

#### 2. Distribución para Canje Externo

Si el tipo de canje es "externo", se aplica la siguiente distribución:

```
nomina = totalDiferencia × 0.05
gananciaTotal = totalDiferencia - nomina
oficinaPZO = gananciaTotal × 0.30
oficinaCCS = gananciaTotal × 0.30
ejecutivo = gananciaTotal × 0.40
```

Donde:
- `nomina`: 5% del total de diferencia para nómina
- `gananciaTotal`: Diferencia total menos la parte de nómina
- `oficinaPZO`: 30% de la ganancia total para la oficina de Puerto Ordaz
- `oficinaCCS`: 30% de la ganancia total para la oficina de Caracas
- `ejecutivo`: 40% de la ganancia total para el ejecutivo

#### 3. Cálculo del Monto Pendiente

```
montoPendiente = montoTotal - totalParcial

Si montoPendiente < 0:
  montoPendiente = 0
```

## Cálculos Comunes

### Montos Pendientes

Para ambos tipos de operaciones, el cálculo del monto pendiente es crucial para determinar si una operación está completa o incompleta:

```
montoPendiente = montoTotal - totalProcesado

Si montoPendiente <= 0.01:  // Tolerancia para errores de redondeo
  montoPendiente = 0
  estado = "completa"
Sino:
  estado = "incompleta"
```

### Redondeo

El sistema utiliza funciones de redondeo para garantizar la precisión en los cálculos financieros:

```
// Para montos en bolívares (2 decimales)
round(value, 2)

// Para tasas (4 decimales)
round(value, 4)
```

## Glosario de Variables

- **amount**: Monto en divisa extranjera de una transacción
- **sellingRate**: Tasa de venta (Bs por unidad de divisa)
- **officeRate**: Tasa de la oficina (Bs por unidad de divisa)
- **clientRate**: Tasa acordada con el cliente
- **bankCommission**: Comisión bancaria seleccionada
- **costCommission**: Porcentaje de comisión de costo (en canjes)
- **saleCommission**: Porcentaje de comisión de venta (en canjes)
- **montoTotal**: Monto total de la operación en divisa
- **montoPendiente**: Monto pendiente por procesar
- **totalParcial**: Suma de montos de todas las transacciones
- **totalDiferencia**: Suma de diferencias (ganancias) de todas las transacciones
- **DISTRIBUTION_FACTORS**: Constantes que definen los porcentajes de distribución

---

*Documento de Fórmulas Matemáticas InterUnido.com - Versión 1.0 - Marzo 2025* 