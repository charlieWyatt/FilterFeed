import requests

def getPoliticalBias(string):
        api_url = "https://api.thebipartisanpress.com/api/endpoints/beta/robert"
        body = {"API": "gAAAAABeVpQJKRM5BqPX91XW2AKfz8pJosk182maAweJcm5ORAkkBFj__d2feG4H5KIeOKFyhUVSY_uGImiaSBCwy2L6nWxx4g==", 
                "Text": string} 
        response = requests.post(api_url, data=body)
        return response.json()

if __name__ == '__main__':
        import argparse
        parser = argparse.ArgumentParser()
        parser.add_argument("inputString", help="Input: String, output: political bias of the string")
        args = parser.parse_args()
        # parse the video URL from command line
        inputString = args.inputString
        print(getPoliticalBias(inputString))