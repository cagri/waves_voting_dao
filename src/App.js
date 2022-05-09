import React, { Component } from 'react';
import { Signer } from '@waves/signer';
import { ProviderWeb } from '@waves.exchange/provider-web';
//import { libs } from '@waves/waves-transactions';
import { ProviderCloud } from '@waves.exchange/provider-cloud';
import { Navbar,Container,Button, Nav,Image,Row,Modal,Col,Form } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const node_address = "https://nodes.wavesnodes.com";

const paymentAsset = "DG2xFkPdDwKUoBkzGAhQtLpSGzfXLiCYPEzeKH2Ad24p"
const rewardAsset = "43W4FcqA1rEpSmUGHoGiXvpSLfhadws9LS5j3SJsKxxS"

class App extends Component {
  constructor() {
    super();
    this.state = {
      signType: '',
      signer: [],
      signedIn: false,
      address: '',
      balances: [],
      showModal: false,
      isBalancesLoaded: false,
      imageUrl: '',
      nftData: [],
      isNftDataLoaded: false,
    }
  }

  componentDidMount() {
    this.dataParser();
  }

  login = async() => {
    const signer = new Signer({
      NODE_URL: node_address
    });
    signer.setProvider(new ProviderWeb());

    try {
      const userData = await signer.login();
      const balances = await signer.getBalance();
      if (userData) {
        const newBalances = this.balancesFilter(balances)
        this.setState({signer: signer,signedIn: true, address:userData.address,showModal:false,signType:'seed',balances: newBalances,isBalancesLoaded: true});
        toast.success("Login Successful!", {
          theme: "colored"
        });
      }
    } catch(err) {
      toast.error("User rejection! try to login again!", {
        theme: "colored"
      });
    }

  }

  loginCloud = async() => {
    const signer = new Signer({
      NODE_URL: node_address
    });

    signer.setProvider(new ProviderCloud())

    try {
      const userData = await signer.login();
      const balances = await signer.getBalance();
      if (userData) {
        const newBalances = this.balancesFilter(balances)
        this.setState({signer: signer,signedIn: true, address:userData.address,showModal:false,signType: 'email',balances: newBalances, isBalancesLoaded: true})
        toast.success("Login Successful!", {
          theme: "colored"
        });
      }
    } catch(err) {
      toast.error("User rejection! try to login again!", {
        theme: "colored"
      });
    }

  }

  loginModalOpen = () => {
    this.setState({showModal: true})
  }

  handleCloseModal = () => {
    this.setState({showModal: false})
  }
  balancesFilter = (balances) => {
      let finalArray = balances.filter(function (e) {
          return e.assetId === paymentAsset || e.assetId === "WAVES" || e.assetId === rewardAsset;
      });
      return finalArray;
  }

  balancesChecker = async () => {
    const signer = this.state.signer;
    const balances = await signer.getBalance();
    const newBalances = this.balancesFilter(balances);
    this.setState({balances: newBalances});
  }

  truncate = (text, startChars, endChars, maxLength) => {
      if (text.length > maxLength) {
          var start = text.substring(0, startChars);
          var end = text.substring(text.length - endChars, text.length);
          while ((start.length + end.length) < maxLength)
          {
              start = start + '.';
          }
          return start + end;
      }
      return text;
  }

  logout = async() => {
    if (this.state.signedIn) {
      await this.state.signer.logout();
      this.setState({signer: '',signedIn: false, address: '', balances: []});
      toast.success("Logged out Successfully!")
    }
  }

  imageChecker = (url) => {
    if (typeof url !== 'string') {
      return false;
    }

    return (url.match(/^http[^?]*.(jpg|jpeg|gif|png|tiff|bmp)(\?(.*))?$/gmi) !== null);
  }

  handleChange = (e) => {
    var image = e.target.value;
    var result = this.imageChecker(image);
    console.log(image)
    if (result) {
      this.setState({imageUrl: image});
    } else {
      toast.error('enter an image url')
    }
  }

  handleSubmit = async () => {
    if (this.state.signedIn) {
      var imageUrl = this.state.imageUrl;
      const a = new Date();
      let time2 = a.getTime();
      const veri = {
        dApp: "3PNUm9xZpDZFkfv7aN125xCEAqpddtouTMv",
        payment: [{
          assetId: "DG2xFkPdDwKUoBkzGAhQtLpSGzfXLiCYPEzeKH2Ad24p",
          amount: 5000000,
        }],
        call: {
          function: 'nftMinter',
          args: [
            {type: 'string', value: imageUrl },
            {type: 'integer', value: time2 },
          ],
        },
      }

      try {
        await this.state.signer.invoke(veri)
        .broadcast().then(data => {

          const obj = {url: imageUrl, time: time2};
          const myJSON = JSON.stringify(obj);
          const data_nft = {
            name: 'WavesNFTMint',
            decimals: 0,
            quantity: 1,
            reissuable: false,
            description: myJSON,
          }

          this.state.signer
            .issue(data_nft)
            .broadcast().then(data2 => {
              console.log(data2)
              const id = data2.id
              toast.success(id+" transaction is completed.");
              this.dataParser();
            });
        });
      } catch(e) {
        console.log(e)
        toast.error(e.message);
      }

    } else {
      toast.error('You need to login first!');
    }

  }


  base16_decode = (hex) => {
      var str = '';
      for (var i = 0; i < hex.length; i += 2) str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
      return str;
  }

  dataParser = async() => {
    await fetch('https://nodes.wavesnodes.com/addresses/data/3PNUm9xZpDZFkfv7aN125xCEAqpddtouTMv/?matches=%5Ba-zA-Z0-9_%5D%2B')
    .then(response => response.json())
    .then(data => {
      console.log(data)
      this.setState({nftData: data, isNftDataLoaded: true})
    });
  }

  split = (arr) => {
    const myArray = arr.split("_");
    let word = myArray[0];

    return this.truncate(word,3,4,12)
  }

  render() {
    const connectButton = () => {
      if (!this.state.signedIn) {
        return (
          <Button onClick={() => this.loginModalOpen()} variant="success">Connect Wallet</Button>
        )
      } else {
        return(
          <>
          <Button onClick={() => this.logout()} variant="light"><i className="fa fa-power-off"></i> {this.truncate(this.state.address,3,4,12)}</Button>
          </>
        )
      }
    }
    return (
      <>
      <ToastContainer />
      <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand href="#home">Waves NFT Minter</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            <Nav.Link href="#home">Mint NFT</Nav.Link>
            <Nav.Link href="#soon">MY NFTs</Nav.Link>
          </Nav>
          {connectButton()}
        </Navbar.Collapse>
      </Container>
      </Navbar>
      <div className="App mb-5 pt-3" bg="dark" variant="dark">
        <Container>
          <Row>
            <Col lg={2}>
            </Col>
            <Col lg={8}>
              <div className="AppBody" id="home">
                <div>
                  <div className="AppTitle mt-5 mb-1">Mint NFT on Waves</div>
                  <div className="AppSubTitle mb-4">Mint some nft. easy to use. just connect wallet and enter an image url. low fees. <br/>proudly working on waves. </div>
                  <div className="AppInput">
                    <Form.Group controlId="formBasicEmail" style={{width: '100%'}}>
                      <Form.Control size="lg" type="text" placeholder="https://" onChange={(e) => this.handleChange(e)}/>
                      <Form.Text className="text-muted" style={{textAlign: 'left'}}>
                        Enter image url.
                      </Form.Text>
                    </Form.Group>
                    <div className="AppMintButton mt-1">
                      <Button variant="dark" onClick={this.handleSubmit}>Mint Now</Button>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
            <Col lg={2}>
            </Col>
          </Row>
        </Container>
      </div>

      <div className="Stage">
        <Container>
          <Row>
          { (this.state.nftData.slice(-20)).reverse().map((data) => (
            <Col lg={3}>
              <div className="nftBox">
                <div style={{fontSize: '12px',marginBottom: '5px'}}><b>Owner:</b> {this.split(data.key)}</div>
                <div className="nftBoxImage">
                  <Image src={this.base16_decode(data.value)}/>
                </div>
              </div>
            </Col>
          ))}
          </Row>
        </Container>
      </div>

      <Modal
        show={this.state.showModal}
        aria-labelledby="contained-modal-title-vcenter"
        onHide={() => this.handleCloseModal()}
        >
        <Modal.Header>
          <Modal.Title id="contained-modal-title-vcenter">
            Waves NFT Minter
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <div className="d-grid gap-2">
            <Button style={{width: '100%', marginBottom:'10px'}} variant="dark" onClick={() => this.loginCloud()}><i className="fa fa-envelope"></i> Login with E-Mail</Button>
            <Button style={{width: '100%'}} variant="dark" onClick={() => this.login()}><i className="fa fa-key"></i> Login with Seed</Button>
          </div>
        </Modal.Body>
      </Modal>
      </>
    );
  }
}

export default App;
