import { useEffect, useState } from "react"
import MyGaugeChart from "./MyGaugeChart"
import RangeSlider from "~rangeSlider"
import DateSlider from "~dateSlider"
import MyDonut from "./MyDonut"
import ytCategoryMapping from "./YTCategories.json"
import dayjs from "dayjs"

import "./style.css"
import { watch } from "fs"

const SENTIMENT_MIN = -1
const SENTIMENT_MAX = 1 

const POLITICAL_MIN = -1
const POLITICAL_MAX = 1

let sentiment_filter_value = (SENTIMENT_MIN + SENTIMENT_MAX)/2 // NEED TO CHANGE THESE BASED ON THE USER'S SLIDING
let political_filter_value = (POLITICAL_MIN + POLITICAL_MAX)/2 // NEED TO CHANGE THESE BASED ON THE USER'S SLIDING
// SHOULD USE THIS FOR THE SLIDER - 
// https://github.com/mui/material-ui/blob/v5.10.2/docs/data/material/components/slider/RangeSlider.tsx



function IndexPopup() {

  const [userId, setUserId] = useState("")
  const [sentiment, setSentiment] = useState(0)
  const [favCategoriesCount, setFavCategoriesCount] = useState([])
  const [categoryLabels, setCategoryLabels] = useState([])
  const [sentimentFilterRange, setSentimentFilterRange] = useState([-1, 1])
  const [politicalFilterRange, setPoliticalFilterRange] = useState([-1, 1])
  const [watchedFilter, setWatchedFilter] = useState(true)
  const [homepageFilter, setHomepageFilter] = useState(true)
  const [timelineRange, setTimelineRange] = useState([dayjs().endOf('day').toDate(), dayjs().endOf('day').add(1, 'day').toDate()])
  const [timelineStart, setTimelineStart] = useState(dayjs().endOf('day').toDate())

  useEffect(() => {
    chrome.identity.getProfileUserInfo({'accountStatus': 'ANY'}, function(info) {
      setUserId(info.id)
      console.log(info.id)
    })
  }, [])

  // loads in all the necessary user information from the backend
  useEffect(() => {
    if (userId != "") {
      // dont run this code until the userId has been found
      getSentimentSummary(userId).then(response => setSentiment(response))
      getFavCategories(userId)

      getFirstDate(userId).then(response => {
        console.log(response)
        setTimelineStart(response)
      })
    }

  }, [userId])

  // once the users first action has been found, this updates the timeline
  useEffect(() => {
    setTimelineRange([timelineStart, dayjs().endOf('day').toDate()])
  }, [timelineStart])

  function backendDateFormat(date) {
    return date.toISOString().substr(0, 10);
  }

  async function getSentimentSummary(userId, startDate = new Date("01-01-2010"), endDate = dayjs().endOf('day').toDate(), homepage=homepageFilter, watched=watchedFilter) {
    let startDateString = backendDateFormat(startDate)
    let endDateString = backendDateFormat(endDate)
    var sentimentResponse = await fetch("http://127.0.0.1:5000/getSentiment/" + userId + "/" + startDateString + "/" + endDateString + "/" + homepageFilter + "/" + watchedFilter)
    var averageSentiment = await sentimentResponse.text()
    return Number(averageSentiment)
  }

  function sortSecondElement(a, b) {
    if (a[1] === b[1]) {
        return 0;
    }
    else {
        return (a[1] > b[1]) ? -1 : 1;
    }
  }

  

  async function getFirstDate(userId) {
    let firstDateResponse = await fetch("http://127.0.0.1:5000/getFirstDate/" + userId)
    let firstDate = await firstDateResponse.json()
    firstDate = new Date(new Date(firstDate.firstDate[0]).setHours(23, 59, 59, 999))
    firstDate.setDate(firstDate.getDate()-1)
    return firstDate
  }

  async function getFavCategories(userId, startDate = new Date("01-01-2010"), endDate = dayjs().endOf('day').toDate(), homepage=homepageFilter, watched=watchedFilter) {
    let startDateString = backendDateFormat(startDate)
    let endDateString = backendDateFormat(endDate)
    // comes in the form of a 2d array where
    // [(category1, number), (category2, number), ...]
    var categoryResponse = await fetch("http://127.0.0.1:5000/getFavCategories/" + userId + "/" + startDateString + "/" + endDateString + "/" + homepage + "/" + watched)
    var jsonResponse = await categoryResponse.json()
    console.log(jsonResponse)
    var categories = jsonResponse.favCategories
    categories.sort(sortSecondElement)
    console.log(categories)
    console.log(jsonResponse)
    let newLabels = []
    let newData = []
    for(const el of categories) {
        newData.push(el[1])
        if(el[0] != null) {
          newLabels.push(ytCategoryMapping[el[0]])
        } else {
          newLabels.push("Unknown") // can be unknown if the thumbnail is never found
        }
        
        // console.log("el[1] = " + el[1] + ". ytCategoryMapping = " + ytCategoryMapping[el[0]] + ". el[0] = " + el[0])
    }
    setFavCategoriesCount(newData)
    setCategoryLabels(newLabels)


  }

  function getPoliticalSummary() {
    return -0.1
  }

  const filterTime = async () => {
    console.log("CLICKED")
    console.log(timelineRange)
    await getFavCategories(userId, timelineRange[0], timelineRange[1])
  }

  const toggleWatched = async () => {
    let newWatched = !watchedFilter // for some reason making this as a seperate variable is neeeded rather than
    setWatchedFilter(newWatched)  // directly setting watchedFilter as !watchedFilter
    await getFavCategories(userId, timelineRange[0], timelineRange[1], homepageFilter, newWatched)
    await getSentimentSummary(userId)
    console.log(watchedFilter)
    console.log(favCategoriesCount)
  }

  const toggleHomepage = async () => {
    let newHomepage = !homepageFilter // for some reason making this as a seperate variable is neeeded rather than
    setHomepageFilter(newHomepage)  // directly setting watchedFilter as !watchedFilter
    await getFavCategories(userId, timelineRange[0], timelineRange[1], newHomepage, watchedFilter)
    await getSentimentSummary(userId)
    console.log(homepageFilter)
    console.log(favCategoriesCount)
  }

  // everytime the filter range changes, send the new value to the content page
  useEffect(() => {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
      var activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, {command: "sentimentFilterRange", range: sentimentFilterRange})
    });
  }, [sentimentFilterRange])



    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: 16,
          width: "800px",
          height: "600px"
        }}>
        
        <div className="grid grid-cols-2 divide-x shadow-md">
          <div>
            <h1 className="flex justify-center">Filter</h1>
            <h2>Positivity Filter</h2>
            {/* SHOULD USE THIS FOR SLIDER - https://github.com/mui/material-ui/blob/v5.10.2/docs/data/material/components/slider/RangeSlider.tsx */}
            <RangeSlider sentimentFilterRange={setSentimentFilterRange} min={SENTIMENT_MIN} max={SENTIMENT_MAX} id={"sentimentFilter"}></RangeSlider>
            <h2>Political Filter</h2>
            <RangeSlider sentimentFilterRange={setPoliticalFilterRange} min={POLITICAL_MIN} max={POLITICAL_MAX} id={"politicalFilter"}></RangeSlider>
          </div>
          <div>
            <h1 className="flex justify-center">Your Stats</h1>
            <button onClick={toggleWatched} className={watchedFilter ? "flex justify-center hover:bg-blue-700 text-black font-bold py-2 px-4 rounded bg-blue-500" : "flex justify-center hover:bg-blue-700 text-white font-bold py-2 px-4 rounded bg-blue-500"}>Watched Videos - {String(watchedFilter)}</button>
            <button onClick={toggleHomepage} className={homepageFilter ? "flex justify-center hover:bg-blue-700 text-black font-bold py-2 px-4 rounded bg-blue-500" : "flex justify-center hover:bg-blue-700 text-white font-bold py-2 px-4 rounded bg-blue-500"}>Homepage Videos - {String(homepageFilter)}</button>
            <h2>Average Sentiment Score</h2>
            <MyGaugeChart id={"SentimentGauge"} myData={sentiment} startRange={SENTIMENT_MIN} endRange={SENTIMENT_MAX} />
            <h2>Average Political Bias</h2>
            <MyGaugeChart id={"PoliticalGauge"} myData={getPoliticalSummary()} friendData={getSentimentSummary()} startRange={POLITICAL_MIN} endRange={POLITICAL_MAX} />
            {/*Graphs to include - Positivity, left wing / right wing */}
          </div>
        </div>
        <button className="flex justify-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Share</button>
        <button className="flex justify-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Get My Raw Data</button>
        <div>
          <h1>Your most suggested categories</h1>
          {categoryLabels.length != 0 ? <MyDonut data={favCategoriesCount} labels={categoryLabels}/> : null} {/*This waits until the data has been collected before showing the donut chart*/}
          {/* <MyDonut data={favCategoriesCount} labels={categoryLabels}/> */}
        </div>
        <div>
          <h1>Time</h1>
          <DateSlider setTimelineRange={setTimelineRange} min={timelineStart.getTime()} max={dayjs().endOf('day').add(1, 'day').toDate().getTime()} id={"timelineFilter"}></DateSlider>
          <button className="flex justify-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={filterTime}>Filter Time</button>
        </div>
        {
        /*Things I want
          - Timeline graph of favourite categories by watchtime / video count
          -    
        */}
      </div>
    )
}

export default IndexPopup
