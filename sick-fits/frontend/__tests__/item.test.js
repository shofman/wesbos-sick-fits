import { shallow } from 'enzyme'
import toJSON from 'enzyme-to-json'
import ItemComponent from '../components/Item'
import Item from '../components/styles/ItemStyles'

const fakeItem = {
  id: '123asdf',
  title: 'A Cool item',
  price: 5000,
  description: 'this item is cool',
  image: 'dog.jpg',
  largeImage: 'largeDog',
}

describe('<Item />', () => {
  it('renders and matches the snapshot', () => {
    const wrapper = shallow(<ItemComponent item={fakeItem} />)

    expect(toJSON(wrapper)).toMatchSnapshot()
  })
  // it('renders and displays properly', () => {
  //   const wrapper = shallow(<ItemComponent item={fakeItem} />)

  //   const PriceTag = wrapper.find('PriceTag')
  //   expect(PriceTag.children().text()).toBe('$50')

  //   expect(wrapper.find('Title a').text()).toBe(fakeItem.title)

  //   const img = wrapper.find('img')
  //   expect(img.props().src).toBe(fakeItem.image)
  //   expect(img.props().alt).toBe(fakeItem.title)
  // })

  // it('renders out the button', () => {
  //   const wrapper = shallow(<ItemComponent item={fakeItem} />)

  //   const buttonList = wrapper.find('.buttonList')
  //   expect(buttonList.children()).toHaveLength(3)

  //   expect(buttonList.find('Link').exists()).toBe(true)
  // })
})