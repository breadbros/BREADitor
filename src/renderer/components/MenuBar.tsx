import React from "react";
import css from "./css/MenuBar.module.css";
import ContextMenu from "react-dockable";
import isElectron from "is-electron";
const electron = isElectron() ? window.require("electron") : null;

class MenuBar extends React.Component {
  state = {
    selected: null,
    contextPos: null
  };

  handleMouseDown = (e, i) => {
    e.stopPropagation();
    let box = e.target.getBoundingClientRect();
    if (this.state.selected === null)
      this.setState({
        selected: i,
        contextPos: { x: box.x, y: box.y + box.height }
      });
    else this.setState({ selected: null });
  };

  handleMenuSelect = (e, i) => {
    let box = e.target.getBoundingClientRect();
    if (this.state.selected !== null)
      this.setState({
        selected: i,
        contextPos: { x: box.x, y: box.y + box.height }
      });
  };

  renderTitle = (draw = true) => {
    return (
      draw && (
        <>
          Index Painter{" "}
          <span style={{ marginLeft: 8, marginTop: 2, fontSize: 11 }}>
            Alpha v0.0.1
          </span>
        </>
      )
    );
  };

  getMenu() {
    return [
      {
        name: (
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 1,
              pointerEvents: "none"
            }}
          >
            <Logo />
          </div>
        ),
        actions: [
          {
            type: "actions",
            actions: {
              "Icon Thing": function() {
                console.log("I did the Icon thing");
              }
            }
          }
        ]
      },
      {
        name: "File",
        actions: [
          {
            type: "actions",
            actions: {
              "New Document": () => {
                this.props.dispatch({
                  type: "CREATE_NEW_DOCUMENT",
                  title: "New Document",
                  width: 512,
                  height: 256
                });
              },
              "File Thing": function() {
                console.log("I did the File thing");
              }
            }
          }
        ]
      },
      {
        name: "Edit",
        actions: [
          {
            type: "actions",
            actions: {
              "Edit Thing": function() {
                console.log("I did the Edit thing");
              }
            }
          }
        ]
      },
      {
        name: "Image",
        actions: [
          {
            type: "actions",
            actions: {
              "Image Thing": function() {
                console.log("I did the Image thing");
              }
            }
          }
        ]
      },
      {
        name: "View",
        actions: [
          {
            type: "actions",
            actions: {
              "View Thing": function() {
                console.log("I did the View thing");
              }
            }
          }
        ]
      },
      {
        name: "Window",
        actions: [
          {
            type: "actions",
            actions: {
              "New Document View": () => {
                this.props.dispatch({
                  type: "CREATE_NEW_DOCUMENT_VIEW"
                });
              }
            }
          },
          {
            type: "bools",
            options: this.getWidgetVisibilityOptions()
          }
        ]
      },
      {
        name: "Help",
        actions: [
          {
            type: "actions",
            actions: {
              "Help Thing": function() {
                console.log("I did the Help thing");
              }
            }
          }
        ]
      }
    ];
  }

  getWidgetVisibilityOptions() {
    // test: {
    //   function: () => {},
    //   value: true
    // }
    return this.props.widgets.reduce((obj, widget) => {
      obj[widget.title] = {
        function: () => {
          // this.props.dispatch({
          //   type: "HIDE",
          //   value: true
          // });
          this.props.dispatch({
            type: "SET_HIDDEN",
            widget: widget.id,
            hidden: !this.props.hidden[widget.id]
          });
        },
        value: !this.props.hidden[widget.id]
      };
      return obj;
    }, {});
  }

  render() {
    return (
      <div className={css.container}>
        {/* Menu Items */}
        <div className={css.menu} style={{ zIndex: 1000 }}>
          {this.getMenu().map((control, i) => (
            <div
              key={i}
              className={[
                css.menuItem,
                this.state.selected === i ? css.selected : null
              ].join(" ")}
              onMouseDown={e => this.handleMouseDown(e, i)}
              onMouseOver={e => this.handleMenuSelect(e, i)}
            >
              {control.name}
            </div>
          ))}
        </div>
        {/* Title bar */}
        <div className={css.dragBar}>{this.renderTitle(false)}</div>

        {/* Window COntrols */}
        {isElectron() && <WindowsControls />}
        {/* Context Menu */}
        {this.state.selected !== null && (
          <ContextMenu
            left={this.state.contextPos.x}
            top={this.state.contextPos.y}
            actions={this.getMenu()[this.state.selected].actions}
            onClickOut={e => this.setState({ selected: null })}
          />
        )}
      </div>
    );
  }
}

function Logo() {
  return (
    <svg
      viewBox="0 0 108 132"
      style={{
        width: "100%",
        height: "100%"
        // filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.5))"
      }}
    >
      <path
        fillRule="evenodd"
        fill="rgb(255, 255, 255)"
        d="M104.912,59.343 L81.627,82.627 L85.113,86.113 C86.675,87.675 86.675,90.207 85.113,91.770 L56.828,120.054 C55.266,121.616 52.734,121.616 51.172,120.054 L22.887,91.770 C21.325,90.207 21.325,87.675 22.887,86.113 L26.373,82.627 L3.088,59.343 C-0.036,56.219 -0.036,51.154 3.088,48.029 L48.343,2.775 C51.467,-0.350 56.533,-0.350 59.657,2.775 L104.912,48.029 C108.036,51.154 108.036,56.219 104.912,59.343 ZM85.113,50.858 L56.828,22.574 C55.266,21.011 52.734,21.011 51.172,22.574 L22.887,50.858 C21.325,52.420 21.325,54.953 22.887,56.515 L37.686,71.314 L51.172,57.828 C52.734,56.266 55.266,56.266 56.828,57.828 L70.314,71.314 L85.113,56.515 C86.675,54.953 86.675,52.420 85.113,50.858 Z"
      />
    </svg>
  );
}

function WindowsControls() {
  return (
    <div className={css.windowsControls}>
      <div
        className={css.button}
        onClick={() => {
          electron.ipcRenderer.send("MINIMIZE");
        }}
      >
        <svg aria-hidden="false" width="12" height="12" viewBox="0 0 12 12">
          <rect fill="currentColor" width="10" height="1" x="1" y="6"></rect>
        </svg>
      </div>
      <div
        className={css.button}
        onClick={() => {
          electron.ipcRenderer.send("MAXIMIZE");
        }}
      >
        <svg aria-hidden="false" width="12" height="12" viewBox="0 0 12 12">
          <rect
            width="9"
            height="9"
            x="1.5"
            y="1.5"
            fill="none"
            stroke="currentColor"
          ></rect>
        </svg>
      </div>
      <div
        className={[css.close, css.button].join(" ")}
        onClick={() => {
          electron.ipcRenderer.send("CLOSE");
        }}
      >
        <svg aria-hidden="false" width="12" height="12" viewBox="0 0 12 12">
          <polygon
            fill="currentColor"
            fillRule="evenodd"
            points="11 1.576 6.583 6 11 10.424 10.424 11 6 6.583 1.576 11 1 10.424 5.417 6 1 1.576 1.576 1 6 5.417 10.424 1"
          ></polygon>
        </svg>
      </div>
    </div>
  );
}

export default MenuBar;
