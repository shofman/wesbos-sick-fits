import { mount } from 'enzyme'
import toJSON from 'enzyme-to-json'
import wait from 'waait'
import { MockedProvider } from 'react-apollo/test-utils'
import { fakeItem } from '../lib/testUtils'
import SingleItem, { SINGLE_ITEM_QUERY } from '../components/SingleItem'

describe('<SingleItem />', () => {
  it('renders with proper data', async () => {
    const mocks = [
      {
        // When somebody makes a request with this query and variable
        request: { query: SINGLE_ITEM_QUERY, variables: { id: '123' } },
        // Return this fake data (mocked data)
        result: {
          data: {
            item: fakeItem(),
          },
        },
      },
    ]
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <SingleItem id="123" />
      </MockedProvider>
    )

    expect(wrapper.text()).toContain('Loading...')

    await wait()
    wrapper.update()
    expect(toJSON(wrapper.find('h2'))).toMatchSnapshot()
    expect(toJSON(wrapper.find('img'))).toMatchSnapshot()
    expect(toJSON(wrapper.find('p'))).toMatchSnapshot()
  })

  it('Errors with a not found item', async () => {
    const mocks = [
      {
        // When somebody makes a request with this query and variable
        request: { query: SINGLE_ITEM_QUERY, variables: { id: '123' } },
        // Return this fake data (mocked data)
        result: {
          errors: [{ message: 'Item not found'}]
        },
      },
    ]

    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <SingleItem id="123" />
      </MockedProvider>
    )

    await wait()
    wrapper.update()

    const item = wrapper.find('[data-test="graphql-error"]')
    expect(item.text()).toContain('Item not found')
    expect(toJSON(item)).toMatchSnapshot()

    // console.log('wrapper.debug()', wrapper.debug())

  })
})
