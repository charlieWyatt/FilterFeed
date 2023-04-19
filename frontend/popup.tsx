import { useEffect, useState } from "react"
import SemanticSearchBar from "./SemanticSearchBar"

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
  
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16,
        width: "800px",
        height: "600px"
      }}>
      <h1>Filter your youtube videos!</h1>
      <SemanticSearchBar/>
    </div>
  )
}

export default IndexPopup
