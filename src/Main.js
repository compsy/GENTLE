import React, { Component } from 'react'
import {
  Route,
  NavLink,
  HashRouter
} from 'react-router-dom'
import NodeButtonComponent from './NodeButtonComponent'
import NodeComponent from './NodeComponent'
import NodeSliderComponent from './NodeSliderComponent'
import NodeCategoriesComponent from './NodeCategoriesComponent'

/**
 * Constants to detect mobile users, and to calculate the
 * size of the actual SVG element, which is used to calculate
 * important properties later on.
 */

const svgHeight = window.innerHeight * 0.75
const svgWidth = (window.innerWidth > 1140 ? 1140 : window.innerWidth) - 60
const mobile = (!!(window.innerWidth < 500 || window.innerHeight < 500)) // to detect small displays, requiring different render

/**
 * Main class, acting as the router and logical interface between
 * the different components.
 *
 * Here callbacks are defined and passed down to the different components.
 *
 * References:
 * Screen layouts and layout calculations are partially inspired from:
 * http://www.tobiasstark.nl/GENSI/GENSI.htm
 *
 *
 */
class Main extends Component {
  /**
   * The constructor inherits formally from component.
   * Thus it is possible to fetch existing user data from an
   * external source and pass that data along via props.
   *
   * e.g. nodes:this.props.nodes could be used to fetch existing nodes.
   * @param {*} props
   */
  constructor (props) {
    super(props)
    // this.ID = 'Test-User'
    this.prevNodes = []
    this.prevFoci = []

    /**
     * Add some basic categories for demonstration.
     */
    this.categories = [{ key: 0, text: 'Cat1', color: '#E27D60' },
      { key: 1, text: 'Cat2', color: '#85DCBA' },
      { key: 2, text: 'Cat3', color: '#E8A87C' },
      { key: 3, text: 'Cat4', color: 'red' }]

    /**
     * Showing how the rendering of categories can also be
     * used to create visually seperating elements on screen.
     */
    this.seperator = [{ key: 0, text: '', color: 'white', x: 1015, y: 35, width: 0, height: 0 },
      { key: 1, text: '', color: 'green', x: svgWidth * 0.5, y: 10, width: 2, height: svgHeight * 0.9 }]
  }

  // Layout re-calculations

  /**
   * Adapts foci to work with different screen sizes.
   * @param {[foci]} foci The foci points of all nodes
   */
  recalculateFoci (foci) {
    const recalculatedF = []
    for (let f = 0; f < foci.length; f++) {
      if (foci[f].key === 0) {
        recalculatedF.push({
          key: foci[f].key,
          x: svgWidth / 2,
          y: svgHeight / 2
        })
      } else {
        const r = (svgWidth < 500 ? 0.375 : 0.7)
        const x = ((svgWidth / 2) + (1.15 * (svgHeight / 2 * r)) * Math.cos((f / 25 * Math.PI * 2) - 2))
        const y = ((svgHeight / 2) + (1.15 * (svgHeight / 2 * r)) * Math.sin((f / 25 * Math.PI * 2) - 2))

        recalculatedF.push({
          key: foci[f].key,
          x: x,
          y: y
        })
      }
    }
    return recalculatedF
  }

  /**
   * recalculate nodes to work with different screen sizes.
   * @param {[nodes]} nodes nodes existing in network
   * @param {[foci]} foci foci of nodes
   */
  recalculateNodes (nodes, foci) {
    for (let n = 0; n < nodes.length; n++) {
      if (nodes[n].key === 0) {
        // set position of new node if device was changed
        nodes[n].floatX = svgWidth / 2
        nodes[n].floatY = svgHeight / 2
      }
      nodes[n].size = (mobile ? 20 : 30)

      if (nodes[n].link && n !== 0) {
        continue
      } else {
        if (!mobile || n === 0) {
          nodes[n].floatX = foci[n].x
          nodes[n].floatY = foci[n].y
          nodes[n].shouldFloat = false
        } else {
          nodes[n].floatX = ((n - 1) % 13 + 1) * 27
          nodes[n].floatY = svgHeight * 0.95 + ((n) > 13 ? 55 : 0)
          nodes[n].shouldFloat = false
        }
      }
    }
    return nodes
  }

  // Callback functions

  /**
   * collects previous nodes + positions used to decide type of render
   * @param {[nodes]} nodes PRIOR array of nodes used to decide re-rendering
   * @param {[foci]} foci PRIOR array of foci used to decide re-rendering
   */
  collectHistory (nodes, foci) {
    this.prevNodes = JSON.parse(JSON.stringify(nodes))
    this.prevFoci = JSON.parse(JSON.stringify(foci))
  }

  /**
   * Used to determine to which node the next selection should apply
   * depending on (partial) completion for a given property of a node
   * @param {String} key property of node for which to determine selection
   * @param {String} criterion criterion on which to base determination
   */

  determineCounter (key, criterion) {
    let output = 0
    const nodes = this.props.network.nodes.slice(1)
    for (let i = 0; i < nodes.length; ++i) {
      if (nodes[i][key] !== criterion) {
        ++output
      }
    }
    this.props.setNetwork({ ...this.props.network, counter: output })
  }

  determineCounterReturn (key, criterion) {
    let output = 1 // Skip "You" node
    const nodes = this.props.network.nodes.slice(1)

    if (this.props.network.correction !== 0) {
      return this.props.network.correction
    }

    for (let i = 0; i < nodes.length; ++i) {
      if (nodes[i][key] !== criterion) {
        ++output
      }
    }

    return output
  }

  /**
   * Receives name from lower components and creates a node
   * with all relevant properties
   * @param {String} name passed from NodeButtonComponent
   */
  createNodesButtonCallback (name) {
    if (this.props.network.counter < this.props.network.nodes.length - 1) {
      // received edit callback previously
      const nodes = JSON.parse(JSON.stringify(this.props.network.nodes))
      nodes[this.props.network.counter].name = name
      this.props.setNetwork({ ...this.props.network, nodes: nodes, counter: this.props.network.nodes.length })
    } else {
      const counter = this.props.network.nodes.length
      if (counter > 25) {
        window.alert('You entered enough names, thank you. Click on a node to change their name!')
      } else if (!name) {
        window.alert('Please provide a Name!')
      } else {
        const nodes = JSON.parse(JSON.stringify(this.props.network.nodes))
        const foci = JSON.parse(JSON.stringify(this.props.network.foci))
        // Just some example properties to provide examples how the
        // different screens can be used to collect different measurements.
        nodes.push({
          key: counter,
          name: name,
          size: (mobile ? 20 : 30),
          fixed: false,
          float: false,
          link: false,
          color: 'grey',
          sex: '',
          age: '',
          category: '',
          categoryColor: 'white',
          fixedPosX: 250,
          fixedPosY: 250,
          closeness: -1,
          liking: -1,
          x: 250,
          y: 250,
          floatX: 0,
          floatY: 0,
          shouldFloat: false
        })

        const r = (svgWidth < 500 ? 0.37 : 0.7)
        const x = ((svgWidth / 2) + (1.15 * (svgHeight / 2 * r)) * Math.cos((counter / 25 * Math.PI * 2) - 2))
        const y = ((svgHeight / 2) + (1.15 * (svgHeight / 2 * r)) * Math.sin((counter / 25 * Math.PI * 2) - 2))

        foci.push({
          key: counter,
          x: x,
          y: y
        })

        // Push state
        this.props.setNetwork({ ...this.props.network, nodes: nodes, foci: foci, counter: counter + 1 })
      }
    }
  }

  /**
   * Keeps track of number of created nodes
   * @param {number} counter to keep track of nodes
   */
  genericNodesCallback (counter) {
    this.props.setNetwork({ ...this.props.network, correction: counter })
  }

  changeSexNodeCallback (counter) {
    const nodes = this.props.network.nodes

    if (nodes[counter].sex === 'male') {
      nodes[counter].sex = 'female'
      nodes[counter].color = 'pink'
    } else {
      nodes[counter].sex = 'male'
      nodes[counter].color = 'blue'
    }
    this.props.setNetwork({ ...this.props.network, nodes: nodes })
  }

  sliderUpdateValue (counter) {
    let value = 1
    if (counter < this.props.network.nodes.length) {
      if (this.props.network.nodes[counter].age !== '') {
        value = parseInt(this.props.network.nodes[counter].age)
      }
    }
    return value
  }

  changeAgeButtonCallback (counter, age) {
    // updates background associated with node
    if (counter >= this.props.network.nodes.length) {
      window.alert('You provided the age for every person, thank you. Click on a node to change their age!')
    } else {
      const nodes = JSON.parse(JSON.stringify(this.props.network.nodes))
      nodes[counter].age = age
      this.props.setNetwork({ ...this.props.network, nodes: nodes, counter: counter + 1, correction: 0 })
    }
  }

  /**
   * Changes category of a node
   * @param {number} counter
   * @param {number} id
   * @param {string} category
   */
  changeCategoryButtonCallback (counter, id, category) {
    // updates background associated with node
    if (counter >= this.props.network.nodes.length) {
      window.alert('You provided the category for every person, thank you. Click on a node to change their category!')
    } else {
      const nodes = JSON.parse(JSON.stringify(this.props.network.nodes))
      nodes[counter].category = category
      nodes[counter].categoryColor = this.categories[id].color
      this.props.setNetwork({ ...this.props.network, nodes: nodes, counter: counter + 1, correction: 0 })
    }
  }

  placeClosenessDragCallback (id, x, y) {
    // collects final placement when drag has ended

    const closeness = Math.abs(x - Math.trunc(svgWidth * 0.5))
    const nodes = this.props.network.nodes
    nodes[id].fixedPosX = x
    nodes[id].fixedPosY = y
    nodes[id].closeness = closeness

    this.props.setNetwork({ ...this.props.network, nodes: nodes })
  }

  placeLikingDragCallback (id, x, y) {
    // collects final placement when drag has ended

    const liking = x / Math.trunc(svgWidth)
    const nodes = this.props.network.nodes
    nodes[id].fixedPosX = x
    nodes[id].fixedPosY = y
    nodes[id].liking = liking

    this.props.setNetwork({ ...this.props.network, nodes: nodes })
  }

  /**
   *   Calculates links between nodes and sets properties for static/dynamic rendering
       When a source is set below, a snapshot of the network is created
       and the nodes are fixed using foci. When a link is popped or created
       the nodes are allowed to float to find their position again.

   * @param {number} counter received from Graph
   * @param {[nodes]} forceNodes received from Graph - copy of nodes
                          for rendering purposes of the network constant position
                          information is necessary for X and Y coordinates. They are
                          stored in floatX and floatY respectively and are used by the
                          network/node view render defined below to update the foci.
   */
  networkNodesCallback (counter, forceNodes) {
    const links = JSON.parse(JSON.stringify(this.props.network.links))
    const nodes = JSON.parse(JSON.stringify(this.props.network.nodes))
    const foci = JSON.parse(JSON.stringify(this.props.network.foci))
    let source = this.props.network.source
    let hasLink = 0
    let linkAt = 0

    if (source === 0 || counter === 0) {
      // prevent connections to anchor "you" node
      source = -1
      this.props.setNetwork({ ...this.props.network, source: source })
    } else {
      if (source === -1) {
        // Initializing source

        for (let i = 0; i < nodes.length; ++i) {
          nodes[i].floatX = forceNodes[i].x
          nodes[i].floatY = forceNodes[i].y
          nodes[i].shouldFloat = false
        }
        this.props.setNetwork({ ...this.props.network, source: counter, nodes: nodes })
      } else {
        // Source exists check for links
        if (source !== counter) {
          for (let i = 0; i < links.length; ++i) {
            if ((links[i].source === source &&
              links[i].target === counter) ||
              (links[i].target === source &&
              links[i].source === counter)) {
              hasLink = 1
              linkAt = i
              break
            }
          }
          if (hasLink) {
            // has link - break
            links.splice(linkAt, 1)
            nodes[source].link -= 1

            nodes[counter].link -= 1
          } else {
            // has no link - create
            links.push({
              key: (links[links.length - 1] ? links[links.length - 1].key + 1 : 1),
              source: source,
              target: counter
            })

            nodes[source].link += 1

            nodes[counter].link += 1
          }
          // determine properties for rendering decision e.g. static vs. dynamic
          for (let i = 0; i < nodes.length; ++i) {
            if (nodes[i].link && i !== 0) {
              nodes[i].floatX = forceNodes[i].x
              nodes[i].floatY = forceNodes[i].y
              nodes[i].shouldFloat = true
            } else {
              if (!mobile || i === 0) {
                nodes[i].floatX = foci[i].x
                nodes[i].floatY = foci[i].y
                nodes[i].shouldFloat = false
              } else {
                nodes[i].floatX = ((i - 1) % 13 + 1) * 27
                nodes[i].floatY = svgHeight * 0.95 + ((i) > 13 ? 55 : 0)
                nodes[i].shouldFloat = false
              }
            }
          }
        }
        // reset source
        source = -1

        this.props.setNetwork({ ...this.props.network, source: source, nodes: nodes, links: links, counter: counter + 1 })
      }
    }
  }

  render () {
    return (
      <HashRouter>
        <div>
          <div className='nav-wrapper'>
            <a href='#' className='brand-logo'>Gentle-1.1</a>
            <ul id='nav-mobile' className='right hide-on-med-and-down'>

              <li>
                <NavLink
                  className='nav-link'
                  exact to='/'
                >1) Name generation example screen.
                </NavLink>
              </li>

              <li>
                <NavLink
                  className='nav-link'
                  exact to='/Click'
                >2) Clicking on Nodes to cycle through multiple options.
                </NavLink>
              </li>

              <li>
                <NavLink
                  className='nav-link'
                  exact to='/Numerical'
                >3) Assign numerical features.
                </NavLink>
              </li>

              <li>
                <NavLink
                  className='nav-link'
                  exact to='/Categories'
                >4) Assign categorical features.
                </NavLink>
              </li>

              <li>
                <NavLink
                  className='nav-link'
                  exact to='/Continuous1'
                >5) Assign continuous relative values 1.
                </NavLink>
              </li>

              <li>
                <NavLink
                  className='nav-link'
                  exact to='/Continuous2'
                >6) Assign continuous relative values 2.
                </NavLink>
              </li>

              <li>
                <NavLink
                  className='nav-link'
                  exact to='/Interconnection'
                >6) Assign connections between nodes.
                </NavLink>
              </li>
            </ul>
          </div>
          <div id='content' className='content container'>
            <Route
              exact path='/' component={() => <NodeButtonComponent
                nodes={this.props.network.nodes.slice(1)}
                route='/Click'
                max={25}
                prevNodes={this.prevNodes}
                counter={this.props.network.nodes.length}
                links={[]}
                foci={this.props.network.foci.slice(1)}
                prevFoci={this.prevFoci}
                callBackNodes={this.genericNodesCallback.bind(this)}
                callBackButton={this.createNodesButtonCallback.bind(this)}
                collectHistory={this.collectHistory.bind(this)}
                textDescription='1) Create Names for up to 25 alters. '
                                              />}
            />

            <Route
              exact path='/Click' component={() => <NodeComponent
                nodes={this.props.network.nodes.slice(1)}
                route='/Numerical'
                prevNodes={this.prevNodes}
                counter={this.determineCounterReturn('sex', '')}
                links={[]}
                foci={this.props.network.foci.slice(1)}
                prevFoci={this.prevFoci}
                callBackNodes={this.changeSexNodeCallback.bind(this)}
                collectHistory={this.collectHistory.bind(this)}
                textDescription='2) Cycle through multiple options, for example to collect the biological sex of alters.'
                                                   />}
            />

            <Route
              exact path='/Numerical' component={() => <NodeSliderComponent
                nodes={this.props.network.nodes.slice(1)}
                route='/Categories'
                prevNodes={this.prevNodes}
                counter={this.determineCounterReturn('age', '')}
                sliderUpdateValue={this.sliderUpdateValue(this.determineCounterReturn('age', ''))}
                links={[]}
                foci={this.props.network.foci.slice(1)}
                prevFoci={this.prevFoci}
                callBackNodes={this.genericNodesCallback.bind(this)}
                callBackButton={this.changeAgeButtonCallback.bind(this)}
                collectHistory={this.collectHistory.bind(this)}
                textDescription='3) Assign a numerical value, for example the age of participants.'
                                                       />}
            />

            <Route
              exact path='/Categories' component={() => <NodeCategoriesComponent
                nodes={this.props.network.nodes.slice(1)}
                route='/Continuous1'
                prevNodes={this.prevNodes}
                counter={this.determineCounterReturn('category', '')}
                links={[]}
                categories={this.categories}
                foci={this.props.network.foci.slice(1)}
                prevFoci={this.prevFoci}
                callBackNodes={this.genericNodesCallback.bind(this)}
                callBackButton={this.changeCategoryButtonCallback.bind(this)}
                collectHistory={this.collectHistory.bind(this)}
                textDescription='4) Click on the buttons to assign a category to a node.'
                                                        />}
            />

            <Route
              exact path='/Continuous1' component={() => <NodeComponent
                fixed={1}
                opac='static'
                nodes={this.props.network.nodes.slice(1).map((node, i) => (
                  {
                    key: node.key,
                    name: node.name,
                    size: node.size,
                    fixed: true,
                    color: node.color,
                    sex: node.sex,
                    age: node.age,
                    categoryColor: node.categoryColor,
                    x: node.fixedPosX,
                    y: node.fixedPosY
                  }
                ))}
                prevNodes={this.prevNodes}
                route='/Continuous2'
                counter={-1}
                links={[]}
                foci={this.props.network.foci.slice(1)}
                prevFoci={this.prevFoci}
                categories={this.seperator}
                callBackNodes={this.placeClosenessDragCallback.bind(this)}
                collectHistory={this.collectHistory.bind(this)}
                textDescription='5) Move nodes closer to the line to indicate proximity. Useful to measure continuous relative scales.'
                                                         />}
            />

            <Route
              exact path='/Continuous2' component={() => <NodeComponent
                fixed={1}
                opac='dynamic'
                nodes={this.props.network.nodes.slice(1).map((node, i) => (
                  {
                    key: node.key,
                    name: node.name,
                    size: node.size,
                    fixed: true,
                    color: node.color,
                    sex: node.sex,
                    age: node.age,
                    categoryColor: node.categoryColor,
                    x: node.fixedPosX,
                    y: node.fixedPosY
                  }
                ))}
                prevNodes={this.prevNodes}
                route='/Interconnection'
                counter={-1}
                links={[]}
                foci={this.props.network.foci.slice(1)}
                prevFoci={this.prevFoci}
                callBackNodes={this.placeLikingDragCallback.bind(this)}
                collectHistory={this.collectHistory.bind(this)}
                textDescription='6) Move nodes closer to the right to indicate proximity. Useful to measure continuous relative scales.'
                                                         />}
            />

            <Route
              exact path='/Interconnection' component={() => <NodeComponent
                nodes={this.props.network.nodes.map((node, i) => (
                  {
                    key: node.key,
                    name: '',
                    size: 10,
                    fixed: false,
                    float: (!!node.shouldFloat),
                    color: node.color,
                    sex: node.sex,
                    age: node.name,
                    categoryColor: node.categoryColor,
                    x: node.floatX,
                    y: node.floatY,
                    link: node.link,
                    floatX: node.floatX,
                    floatY: node.floatY
                  }
                ))}
                prevNodes={this.prevNodes}
                updateCounter={this.determineCounter.bind(this)}
                counter={-1}
                float={1}
                links={this.props.network.links}
                foci={this.props.network.foci.map((focus, i) => (
                  {
                    key: focus.key,
                    x: (!mobile || i === 0 ? (this.props.network.nodes[i].floatX ? this.props.network.nodes[i].floatX : focus.x) : (this.props.network.nodes[i].floatX ? this.props.network.nodes[i].floatX : ((i - 1) % 13 + 1) * 27)),
                    y: (!mobile || i === 0 ? (this.props.network.nodes[i].floatY ? this.props.network.nodes[i].floatY : focus.y) : (this.props.network.nodes[i].floatY ? this.props.network.nodes[i].floatY : svgHeight * 0.95 + ((i) > 13 ? 55 : 0)))
                  }
                ))}
                prevFoci={this.prevFoci}
                callBackNodes={this.networkNodesCallback.bind(this)}
                collectHistory={this.collectHistory.bind(this)}
                textDescription='7) Allows to link connected people together and to split existing links by clicking on two connected nodes.'
                                                             />}
            />
          </div>
        </div>
      </HashRouter>
    )
  }
}

export default Main
