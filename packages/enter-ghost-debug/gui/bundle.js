'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var replay = require('../replay');

var Events = function Events(_ref) {
    var events = _ref.events;


    return _react2.default.createElement(
        'ul',
        null,
        events.map(function (e, i) {
            return _react2.default.createElement(
                'li',
                { key: i },
                _react2.default.createElement(
                    'h4',
                    null,
                    e.type
                ),
                _react2.default.createElement(
                    'div',
                    null,
                    JSON.stringify(e, function (k, v) {
                        return k == 'type' ? undefined : v;
                    })
                )
            );
        })
    );
};

module.exports = function (_ref2) {
    var data = _ref2.data,
        el = _ref2.el;

    var els = [];
    var events = data.events;
    console.log("XXAAAAA", events);

    var Foldable = function (_React$Component) {
        _inherits(Foldable, _React$Component);

        function Foldable(props) {
            _classCallCheck(this, Foldable);

            var _this = _possibleConstructorReturn(this, (Foldable.__proto__ || Object.getPrototypeOf(Foldable)).call(this, props));

            _this.state = {
                fold: false
            };
            return _this;
        }

        _createClass(Foldable, [{
            key: 'render',
            value: function render() {
                var _this2 = this;

                return _react2.default.createElement(
                    'div',
                    { className: 'foldable', onClick: function onClick(e) {
                            _this2.setState({ fold: !_this2.state.fold });
                            e.stopPropagation();
                        } },
                    this.props.children[0],
                    !this.state.fold && this.props.children[1],
                    this.props.children[2]
                );
            }
        }]);

        return Foldable;
    }(_react2.default.Component);

    ;

    replay(events, function (_ref3) {
        var state = _ref3.state,
            stringify = _ref3.stringify;

        var currEls = els;
        var stack = [];
        var c = 0;
        return {
            func: function func(_ref4) {
                var name = _ref4.name;

                //levels[0] && levels[0].push();
                //levels.push(state.currentFunction);
                stack.push(currEls);
                currEls = [];
            },
            ret: function ret() {
                var _state$currentFunctio = state.currentFunction,
                    args = _state$currentFunctio.args,
                    value = _state$currentFunctio.value,
                    name = _state$currentFunctio.name;

                var children = currEls;
                currEls = stack.pop();
                currEls.push(_react2.default.createElement(
                    Foldable,
                    { key: c++ },
                    _react2.default.createElement(
                        'div',
                        { className: 'name' },
                        _react2.default.createElement(
                            'i',
                            null,
                            name
                        ),
                        '(',
                        _react2.default.createElement(
                            'span',
                            { style: { color: '#55e' } },
                            args.map(function (a) {
                                return stringify(a);
                            }).join(', ')
                        ),
                        ')'
                    ),
                    _react2.default.createElement(
                        'ul',
                        null,
                        children.map(function (ch, i) {
                            return _react2.default.createElement(
                                'li',
                                { key: i },
                                ch
                            );
                        })
                    ),
                    _react2.default.createElement(
                        'div',
                        { key: 'value' },
                        _react2.default.createElement(
                            'span',
                            { style: { color: '#aaa' } },
                            '=>'
                        ),
                        ' ',
                        _react2.default.createElement(
                            'span',
                            { className: 'value' },
                            stringify(value)
                        )
                    )
                ));
            }
        };
    });

    console.log("ELS", els);
    _reactDom2.default.render(_react2.default.createElement(
        'div',
        null,
        els,
        _react2.default.createElement(Events, { events: events })
    ), el);
};

