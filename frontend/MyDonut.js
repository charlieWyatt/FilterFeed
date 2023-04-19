import React, { useEffect, useState } from "react"
import ReactApexChart from 'react-apexcharts';


export default function MyDonut(props) {
    // maybe need to pass the setters for the donut up to the 
    
    // console.log(props.data)
    // console.log(props.labels)
    console.log(props)

    myOptions =
            {   
                chart: {
                    width: 380,
                    type: 'donut',
                },
                labels: props.labels,
                dataLabels: {
                    enabled: false
                },
                responsive: [{
                    breakpoint: 480,
                    options: {
                    chart: {
                        width: 200
                    },
                    legend: {
                        show: false
                    }
                    }
                }],
                legend: {
                    position: 'right',
                    offsetY: 0,
                    height: 230,
                }
            }
    
    

    return (
        <div>
            <div className="chart-wrap">
                <div id="chart">
                    <ReactApexChart options={myOptions} series={props.data} type="donut" width={380} />
                </div>
            </div>
        </div>
        
    )
}