import React, { useEffect, useState } from "react"

export default function SemanticSearchBar({}) {
    const [searchInput, setSearchInput] = React.useState("")

    const useEffect = (event) => {
        console.log(searchInput)
        // get the current search input if there is one
    }

    const handleChange = (event) => {
        setSearchInput(event.target.value)
    }

    const handleClick = (event) => {
        console.log('clicked')
        // send the search input to the backend
    }

    return (
        <div>
            <input type="text" placeholder="Search here" onChange={handleChange} value={searchInput} />
            <button className="flex justify-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={handleClick}>Search</button>
        </div>
    )
}