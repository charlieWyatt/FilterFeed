// this code comes from here - https://github.com/mui/material-ui/blob/v5.10.2/docs/data/material/components/slider/RangeSlider.tsx 

import * as React from 'react';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';

function valuetext(value: number) {
  return `${value}°C`;
}

export default function RangeSlider({sentimentFilterRange, min, max, id}) {
  const [value, setValue] = React.useState<number[]>([min, max]); // these are default values

  const handleChange = (event: Event, newValue: number | number[]) => {
    setValue(newValue as number[]);
    sentimentFilterRange(newValue)
    
  };

  return (
    <Box sx={{ width: 300 }}>
      <Slider
        getAriaLabel={() => id}
        value={value}
        onChange={handleChange}
        valueLabelDisplay="auto"
        getAriaValueText={valuetext}
        min={min}
        max={max}
        step={0.01}
      />
    </Box>
  );
}
