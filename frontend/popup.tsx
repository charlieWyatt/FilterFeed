import { useEffect, useState } from "react"
import MyGaugeChart from "./MyGaugeChart"
import RangeSlider from "~rangeSlider"

import "./style.css"

const SENTIMENT_MIN = -1
const SENTIMENT_MAX = 1 

const POLITICAL_MIN = -1
const POLITICAL_MAX = 1

let sentiment_filter_value = (SENTIMENT_MIN + SENTIMENT_MAX)/2 // NEED TO CHANGE THESE BASED ON THE USER'S SLIDING
let political_filter_value = (POLITICAL_MIN + POLITICAL_MAX)/2 // NEED TO CHANGE THESE BASED ON THE USER'S SLIDING
// SHOULD USE THIS FOR THE SLIDER - 
// https://github.com/mui/material-ui/blob/v5.10.2/docs/data/material/components/slider/RangeSlider.tsx

function IndexPopup() {
  const [data, setData] = useState("")



async function getSentimentSummary() {
  var sentimentResponse = await fetch("http://127.0.0.1:5000/getSentiment")
  var averageSentiment = await sentimentResponse.text()
  return Number(averageSentiment)
}

function getPoliticalSummary() {
  return -0.1
}

const [sentiment, setSentiment] = useState(0)
const [sentimentFilterRange, setSentimentFilterRange] = useState([-1, 1])
const [politicalFilterRange, setPoliticalFilterRange] = useState([-1, 1])

useEffect(() => {
  getSentimentSummary().then(response => setSentiment(response))
}, [])

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16,
        width: "800px",
        height: "600px"
      }}>
      
      <div class="grid grid-cols-2 divide-x shadow-md">
        <div>
          <h1 class="flex justify-center">Filter</h1>
          <h2>Positivity Filter</h2>
          {/* SHOULD USE THIS FOR SLIDER - https://github.com/mui/material-ui/blob/v5.10.2/docs/data/material/components/slider/RangeSlider.tsx */}
          <RangeSlider sentimentFilterRange={setSentimentFilterRange} min={SENTIMENT_MIN} max={SENTIMENT_MAX} id={"sentimentFilter"}></RangeSlider>
          <h2>Political Filter</h2>
          <RangeSlider sentimentFilterRange={setPoliticalFilterRange} min={POLITICAL_MIN} max={POLITICAL_MAX} id={"politicalFilter"}></RangeSlider>
        </div>
        <div>
          <h1 class="flex justify-center">Your Stats</h1>
          <button class="flex justify-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Clicked Videos / Recommended Videos</button>
          <h2>Average Sentiment Score</h2>
          <MyGaugeChart id={"SentimentGauge"} myData={sentiment} startRange={SENTIMENT_MIN} endRange={SENTIMENT_MAX} />
          <h2>Average Political Bias</h2>
          <MyGaugeChart id={"PoliticalGauge"} myData={getPoliticalSummary()} friendData={getSentimentSummary()} startRange={POLITICAL_MIN} endRange={POLITICAL_MAX} />
          {/*Graphs to include - Positivity, left wing / right wing */}
        </div>
      </div>
    </div>
  )
}

export default IndexPopup
