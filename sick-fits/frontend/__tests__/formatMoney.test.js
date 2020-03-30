import formatMoney from '../lib/formatMoney'

describe('Validate format money', () => {
  it('works with fractional dollars', () => {
    expect(formatMoney(1)).toEqual('$0.01')
    expect(formatMoney(10)).toEqual('$0.10')
    expect(formatMoney(9)).toEqual('$0.09')
    expect(formatMoney(40)).toEqual('$0.40')
  })
  it('It removes cents from whole dollars', () => {
    expect(formatMoney(5000)).toEqual('$50')
    expect(formatMoney(100)).toEqual('$1')
  })

  it('works with whole and fractional dollars', () => {
    expect(formatMoney(5012)).toEqual('$50.12')
    expect(formatMoney(101)).toEqual('$1.01')
    expect(formatMoney(110)).toEqual('$1.10')
    expect(formatMoney(123123)).toEqual('$1,231.23')
  })
})
