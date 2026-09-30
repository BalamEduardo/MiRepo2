# Product

<!-- impeccable:product-schema 1 -->

## Platform

ios

## Users

A single person recording the current peso value of their personal accounts and investment positions once a week.

## Product Purpose

DineroMio keeps a private weekly snapshot of personal assets, calculates their combined value and distribution, and optionally reserves bank cash for weekly expenses. A simple local expense register estimates the current total without changing recorded balances.

## Positioning

DineroMio is a manual, local weekly balance book focused on seven named accounts and positions. It does not connect to financial institutions or treat a balance change as investment performance.

## Operating Context

The user creates a weekly cut on their iPhone, entering current MXN values gathered manually. The first saved cut starts a new in-app history. Later cuts begin with the previous cut's values so the user only needs to update changed amounts.

## Capabilities and Constraints

- Track Santander, Nu, Openbank, uninvested GBM cash, VTI, VXUS, and BTC as separate values in MXN.
- Calculate the total, each item's share of the total, and the difference from the preceding cut.
- Label the difference as a balance variation, not investment return, since deposits and withdrawals can change it.
- Reserve an optional weekly MXN budget from Santander, Nu, Openbank and uninvested GBM cash only. Optionally allocate it to Súper, Comida, Cena, Gustos and Otros.
- Copy the previous budget into each new cut. A budget expresses spending intent without reducing recorded balances.
- Use a fixed light appearance.
- Keep a local history of cuts that can be viewed, edited, and deleted.
- Accept decimal input with a period or comma, and validate every value before saving.
- Store cuts and expenses only on the device. Do not add user accounts, a backend, cloud sync, live quotes, income or transfers, or Excel history migration.
- Expenses have a positive amount in cents, one fixed category, an optional description and an automatic timestamp. Allow corrections and confirmed deletion within their original period.
- Each new cut copies balances and budget but starts with no expenses. Prompt the user to update actual balances including prior spending.
- Current estimate = recorded total minus expenses. Remaining budget = max(budget minus expenses, zero). Projected total = current estimate minus remaining budget. Overspending is allowed.
- Begin with an empty history; do not seed the app with the user's actual balances.

## Brand Commitments

The product name is DineroMio. Interface copy is in Spanish.

## Evidence on Hand

The user-provided `Plan_Semanal_ETF_BTC.xlsx` informed the seven tracked names. Its existing history is not part of the app's initial data.

## Product Principles

- Keep each bank balance, cash balance, and investment position visible as its own value.
- Make the total and the preceding-cut comparison easy to understand.
- Keep personal balances under the user's control on their device.
- Distinguish a change in total assets from investment performance.
- Make weekly corrections possible without reconstructing earlier cuts.
