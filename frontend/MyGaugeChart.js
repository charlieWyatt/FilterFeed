import React, { useEffect, useState } from "react"
import GaugeChart from 'react-advanced-gauge-chart'


export default function MyGaugeChart({id, myData, friendData = null, startRange, endRange}) {
    // data is passed in as a list so that in future we can pass in more data to compare with a friend
    let myPercent = (myData-startRange)/(endRange - startRange)
    let friendPercent;
    if(friendData) {
        friendPercent = (friendData-startRange)/(endRange - startRange)
    }

    return (
        <div className="bg-slate-900">
            <GaugeChart id={id} percent={myPercent}
                    textColor="black"
                    nrOfLevels={5}
                    colors={id=="PoliticalGauge" ? ["#FF0000", "#0000FF"] : ["#FF0000", "#00FF00"]}
                    />
        </div>
        
    )
}