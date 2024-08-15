
import * as DigitalBaconUI from 'digitalbacon-ui';
import * as Styles from './xrLegoStyles.js';

const { Div, Span, Text, TextInput } = DigitalBaconUI;

const legoBuilds = {
    'Car': 'images/Car.png',
    'Radar Truck': 'images/Radar Truck.png',
    'Trailer': 'images/Trailer.png',
    'Bulldozer': 'images/Bulldozer.png',
    'Helicopter': 'images/Helicopter.png',
    'X-Wing mini': 'images/X-Wing mini.png',
    'AT-ST mini': 'images/AT-ST mini.png',
    'AT-AT mini': 'images/AT-AT mini.png',
    'Shuttle': 'images/Shuttle.png',
    'TIE Interceptor': 'images/TIE Interceptor.png',
    'Star Fighter': 'images/Star Fighter.png',
    'X-Wing': 'images/X-Wing.png',
    'AT-ST': 'images/AT-ST.png'
}

export default class xrLegoMainUI {
    constructor(playbackController) {
        this._playbackController = playbackController;
        this._playlistTrackSpans = [];
        this._searchTrackSpans = [];
        this._createContent();
    }

    _createContent() {
        this._body = new DigitalBaconUI.Body({
            borderRadius: 0.05,
            borderWidth: 0.001,
            glassmorphism: true,
            justifyContent: 'spaceBetween',
            width: 0.5,
            height: 0.6,
          });

          const row1 = new DigitalBaconUI.Span({
            backgroundVisible: true,
            borderTopLeftRadius: 0.05,
            borderTopRightRadius: 0.05,
            glassmorphism: true,
            materialColor: '#dddddd',
            height: 0.1,
            width: '100%',
            justifyContent: 'spaceEvenly',
          });

          const row2 = new Div(Styles.sectionStyle,
            { height: 0.6, overflow: 'scroll', width: '100%' });

          const row3 = new DigitalBaconUI.Span({
            backgroundVisible: true,
            justifyContent: 'spaceEvenly',
            borderBottomLeftRadius: 0.05,
            borderBottomRightRadius: 0.05,
            materialColor: '#000000',
            height: 0.1,
            width: '100%',
          });

          const titleTextStyle = new DigitalBaconUI.Style({
            color: '#303030',
            fontSize: 0.052,
            maxWidth: '100%',
          });

          const buttonTextStyle = new DigitalBaconUI.Style({
            color: '#303030',
            fontSize: 0.020,
            maxWidth: '100%',
          });

          const countTextStyle = new DigitalBaconUI.Style({
            color: '#ffffff',
            fontSize: 0.030,
            maxWidth: '100%',
          });

          const text = new DigitalBaconUI.Text('xrBrickViewer', titleTextStyle);
          row1.add(text)

          for (const [name, imageURL] of Object.entries(legoBuilds)) { // sure? lol wtf 
            console.log(name, imageURL);
            let span = new Span({
                glassmorphism: true,
                height: 0.067,
                materialColor: 0x606d75,
                paddingTop: 0.01,
                paddingBottom: 0.01,
                paddingLeft: 0.0225,
                width:'100%',
            });
            let image = new DigitalBaconUI.Image(imageURL,
                { height: '100%', padding: 0.01 });
            let text = new Text(name, Styles.colorWhite,
                Styles.font500, Styles.fontMedium, { marginLeft: 0.02 });
            row2.add(span);
            span.add(image);
            span.add(text);
            span.onClick = () => this._loadPlaylist(item);
            span.pointerInteractable.addHoveredCallback((hovered) => {
                span.backgroundVisible = (hovered) ? true : false;
                window.span = span;
            });
          }

          const prevButton = new DigitalBaconUI.Div({
            backgroundVisible: true,
            borderRadius: 0.01,
            height: 0.05,
            justifyContent: 'center',
            marginBottom: 0.01,
            materialColor: 0xed2d70,
            width: 0.1,
          });
          const nextButton = new DigitalBaconUI.Div({
            backgroundVisible: true,
            borderRadius: 0.01,
            height: 0.05,
            justifyContent: 'center',
            marginBottom: 0.01,
            materialColor: 0x47de83,
            width: 0.1,
          });

          const prevText = new DigitalBaconUI.Text('Previous', buttonTextStyle);
          const nextText = new DigitalBaconUI.Text('Next', buttonTextStyle);
          prevButton.add(prevText); 
          nextButton.add(nextText); 

          const step = new DigitalBaconUI.Text("?/?", countTextStyle); 

          let count = 0; 

          prevButton.onClick = () => {
            count--;
            step.text = String(count);
          };
          prevButton.pointerInteractable.addHoveredCallback((hovered) => {
            //buttonText.position.z = (hovered) ? 0.01 : 0;
            console.log("hi from prevButton")
            prevButton.scale.fromArray((hovered) ? [1.1, 1.1, 1.1] : [1, 1, 1]);
          });

          nextButton.onClick = () => {
            count++;
            step.text = String(count);
          };
          nextButton.pointerInteractable.addHoveredCallback((hovered) => {
            //buttonText.position.z = (hovered) ? 0.01 : 0;
            console.log("hi from nextButton")
            nextButton.scale.fromArray((hovered) ? [1.1, 1.1, 1.1] : [1, 1, 1]);
          });

          row3.add(prevButton); 
          row3.add(nextButton); 
          row3.add(step); 

          this._body.position.set(-.5, 1.7, -1);
          this._body.add(row1);
          this._body.add(row2);
          this._body.add(row3);

    }
    
    getObject() {
        return this._body;
    }
}