# Rakshak

Rashak - Track & protact PII on your website.

Chrome Extension - https://chrome.google.com/webstore/detail/rakshak/bgcklfalfikbieaakdjpjaeehodfhmec

A friendly tool to trace & protect PII (Personally Identifiable Info) on your website
Rakshak inspects HTTP requests and parses the response to check if any PII information has been detected. After monitoring, it presents you a beautiful UI showing all the required details. 

Features - 

- Parses response of all HTTP requests on the current page
- Light weight
- Detect PII such as Mobile Number, Email, Pan Card & Pin Code. 
- Open source 

### Features

v0.0.1
- :heavy_check_mark: Should be able to log & parse all requests
- :heavy_check_mark: Should be able to parse (xhr) API responses
- :heavy_check_mark: Should be able to show all the requests with JSON response
- :heavy_check_mark: Check boxes for PAN CARD, MOBILE NUMBER, EMAIL
- :heavy_check_mark: Should be able to show if any API is giving unwanted response 
- :heavy_check_mark: API wise PII detection 

v0.0.2 
- Should be able to custom define the regex
- User should be able to download the summary in csv format
