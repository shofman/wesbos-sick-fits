import PropTypes from 'prop-types'
import Reset from '../components/Reset'

const ResetPage = props => (
  <div>
    <Reset resetToken={props.query.resetToken} />
  </div>
)

ResetPage.propTypes = {
  query: PropTypes.object,
}

export default ResetPage
