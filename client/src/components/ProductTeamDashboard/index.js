import { connect } from 'react-redux';
import ProductTeamDashboard from './ProductTeamDashboard';

const mapStateToProps = (state) => ({
  // Add any Redux state that the component needs
  // For example: items: state.admin.items
});

const mapDispatchToProps = {
  // Add any Redux actions that the component needs to dispatch
  // For example: fetchItems
};

export default connect(mapStateToProps, mapDispatchToProps)(ProductTeamDashboard);
