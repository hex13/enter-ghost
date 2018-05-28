import React, { Component } from 'react';

const scaleX = 100;
const scaleY = -10;
const axisX = 200;
const axisY = 200;

const margin = 10;

const defaults = {
    axisColor: 'black',
    getLabel: (v, i, arr) => i,
};

function Label() {

}

class Chart extends Component {
    render() {
        const { numbers, width, height, axisColor = defaults.axisColor,
            getLabel = defaults.getLabel

        } = this.props;

        return <svg width={ width } height={ height }>
            <g transform={`translate(${ axisX }, ${ axisY})`}>
                <line x1={ 0 } y1={ 0 } x2={ width } y2={ 0 } stroke={ axisColor } />
                <line x1={ 0 } y1={ 0 } x2={ width } y2={ 0 } stroke={ axisColor } />
                <line x1={ 0 } y1={ 0 } x2={ 0 } y2={ 100 * scaleY } stroke={ axisColor } />
                {
                    numbers.map((n, i, arr) => {
                        if (i == arr.length - 1) return;
                        const x1 = i * scaleX;
                        const x2 = x1 + scaleX;
                        const y1 = n * scaleY;
                        const y2 = arr[i + 1] * scaleY;
                        const dy = y2 - y1;
                        const dx = x2 - x1;
                        const angle = Math.atan2(dy, dx);
                        const length = Math.sqrt(dx * dx + dy * dy);
                        
                        return [
                            <line 
                                x1={x1} 
                                y1={y1} 
                                x2={x2} 
                                y2={y2} 
                                stroke="red"
                                strokeWidth="4"
                                strokeLinecap="round"
                                key={i}
                            />,
                            <circle 
                                cx={x1}
                                cy={y1} 
                                r={8} 
                                fill="white"
                            />,                                                                                              
                            <circle 
                                cx={x1}
                                cy={y1} 
                                r={4} 
                                fill="green"
                            />,                 

                            <line
                                x1={ i * scaleX }
                                y1={ 0 }
                                x2={ i * scaleX }
                                y2={ 10 }                            
                                stroke={ axisColor }
                            />,                        
                            <text 
                                fill="red"
                                x={ i * scaleX }
                                y={ 20 }
                                style={{fontSize: 10, fontWeight: 'normal', textAnchor: 'middle'}}
                            >
                                { getLabel(n, i, arr) }
                            </text>                        
                        ]
                    })
                }
            </g>
        </svg>
    }
}

export default Chart;


// import React, { Component } from 'react';
// import logo from './logo.svg';
// import './App.css';

// const scaleX = 20;
// const scaleY = -10;
// const axisY = 200;
// const margin = 10;

// class Chart extends Component {
//     render() {
//         const numbers = this.props.numbers;
//         return <svg width="1000" height="1000">
//             {
//                 numbers.map((n, i, arr) => {
//                     if (i == arr.length - 1) return;
//                     const x1 = i * scaleX;
//                     const x2 = x1 + scaleX;
//                     const y1 = axisY + n * scaleY;
//                     const y2 = axisY + arr[i + 1] * scaleY;
//                     const dy = y2 - y1;
//                     const dx = x2 - x1;
//                     const angle = Math.atan2(dy, dx);
//                     const length = Math.sqrt(dx * dx + dy * dy);
                    
//                     return [
//                         <line 
//                             x1={x1 + Math.cos(angle) * margin} 
//                             y1={y1 + Math.sin(angle) * margin} 
//                             x2={x1 + Math.cos(angle) * (length - margin)} 
//                             y2={y1 + Math.sin(angle) * (length - margin)} 
//                             stroke="red"
//                             strokeWidth="4"
//                             strokeLinecap="round"
//                             key={i}
//                         />,
//                         <circle 
//                             cx={x1}
//                             cy={y1} 
//                             r={4} 
//                             fill="rgba(0,0,0,0.5)"
//                         />,                                              
//                     ]
//                 })
//             }
//         </svg>
//     }
// }

// export default Chart;


