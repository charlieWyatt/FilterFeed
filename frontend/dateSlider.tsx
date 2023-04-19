// this code comes from here - https://github.com/mui/material-ui/blob/v5.10.2/docs/data/material/components/slider/RangeSlider.tsx 

import * as React from 'react';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';

function valuetext(value: number) {
  let totalMiliSeconds = value;
  let tooltip = new Date(totalMiliSeconds).toLocaleDateString();
  return tooltip;
}

export default function DateSlider({setTimelineRange, min, max, id}) {
  // min and max are passed in as .getTime() because they have to be numbers
  const [value, setValue] = React.useState<number[]>([min, max]); // these are default values

  const handleChange = (event: Event, newValue: number | number[]) => {
    setValue(newValue as number[]);
    setTimelineRange([new Date(newValue[0]), new Date(newValue[1])])
    
  };

  // const valuetext = (value: number) => {
  //   let totalMiliSeconds = value;
  //   let custom = { year: "numeric", month: "short", day: "numeric" };
  //   let tooltip = new Date(totalMiliSeconds).toLocaleDateString();
  //   console.log(tooltip)
  //   return tooltip;
  // }


  return (
    <Box sx={{ width: 300 }}>
      <Slider
        getAriaLabel={() => id}
        value={value}
        onChange={handleChange}
        valueLabelDisplay="auto"
        valueLabelFormat={valuetext}
        getAriaValueText={valuetext}
        min={min}
        max={max}
        step={86400000} // a two day step I think
      />
    </Box>
  );
}
