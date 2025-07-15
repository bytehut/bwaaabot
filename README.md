Guilded bot created by https://www.guilded.gg/u/bwaaa

Template from https://github.com/zaida04/guilded.js/tree/main/packages/create-guilded-app

Vibe coded project for fun to learn about Guilded bot API and Spotify API. Feel free to clone and run your own instance!

Note: Requires Spotify API's extended quota mode to allow users to connect without adding their email to the Spotify Dashboard first.

Current features:
- Spotify Bot Commands:
    - !spotify connect - Connect your Spotify account
    - !spotify now - Show currently playing track
    - !spotify top tracks [time_range] - Show your top tracks
        - Time ranges: short_term (4 weeks), medium_term (6 months), long_term (years)
    - !spotify top artists [time_range] - Show your top artists
        - Time ranges: short_term (4 weeks), medium_term (6 months), long_term (years)
    - !spotify disconnect - Disconnect your Spotify account

- Spotify Listen Along:
    - Listen Along Commands:
    - !spotify listenalong create
    - !spotify listenalong join [roomId]
    - !spotify listenalong view
    - !spotify listenalong disconnect

Next steps:
- Detect when listeners desync for automatic disconnect from listen alongs
- Add listen along history
- Improve UX with embeds and additional information for listen alongs
- Fix all the bugs lol