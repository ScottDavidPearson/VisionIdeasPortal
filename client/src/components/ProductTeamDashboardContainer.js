import { connect } from 'react-redux';
import ProductTeamDashboard from './ProductTeamDashboard';

// Map Redux state to component props
const mapStateToProps = (state) => ({
  // Add any Redux state that the component needs
  // For example: ideas: state.ideas
});

// Map Redux actions to component props
const mapDispatchToProps = {
  // Add any Redux actions that the component needs to dispatch
  // For example: fetchIdeas: fetchIdeasAction
};

// Connect the component to Redux
export default connect(mapStateToProps, mapDispatchToProps)(ProductTeamDashboard);
