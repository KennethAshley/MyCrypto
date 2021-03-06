import { Identicon, UnitDisplay } from 'components/ui';
import { IWallet, Balance, TrezorWallet, LedgerWallet } from 'libs/wallet';
import React from 'react';
import translate from 'translations';
import './AccountInfo.scss';
import Spinner from 'components/ui/Spinner';
import { getNetworkConfig, getOffline } from 'selectors/config';
import { AppState } from 'reducers';
import { connect } from 'react-redux';
import { NetworkConfig } from 'types/network';
import { TSetAccountBalance, setAccountBalance } from 'actions/wallet';

interface OwnProps {
  wallet: IWallet;
}

interface StateProps {
  balance: Balance;
  network: NetworkConfig;
  isOffline: boolean;
}

interface State {
  showLongBalance: boolean;
  address: string;
  confirmAddr: boolean;
}

interface DispatchProps {
  setAccountBalance: TSetAccountBalance;
}

type Props = OwnProps & StateProps & DispatchProps;

class AccountInfo extends React.Component<Props, State> {
  public state = {
    showLongBalance: false,
    address: '',
    confirmAddr: false
  };

  public setAddressFromWallet() {
    const address = this.props.wallet.getAddressString();
    if (address !== this.state.address) {
      this.setState({ address });
    }
  }

  public componentDidMount() {
    this.setAddressFromWallet();
  }

  public componentDidUpdate() {
    this.setAddressFromWallet();
  }

  public toggleConfirmAddr = () => {
    this.setState(state => {
      return { confirmAddr: !state.confirmAddr };
    });
  };

  public toggleShowLongBalance = (e: React.FormEvent<HTMLSpanElement>) => {
    e.preventDefault();
    this.setState(state => {
      return {
        showLongBalance: !state.showLongBalance
      };
    });
  };

  public render() {
    const { network, balance, isOffline } = this.props;
    const { address, showLongBalance, confirmAddr } = this.state;
    let blockExplorer;
    let tokenExplorer;
    if (!network.isCustom) {
      // this is kind of ugly but its the result of typeguards, maybe we can find a cleaner solution later on such as just dedicating it to a selector
      blockExplorer = network.blockExplorer;
      tokenExplorer = network.tokenExplorer;
    }

    const wallet = this.props.wallet as LedgerWallet | TrezorWallet;
    return (
      <div className="AccountInfo">
        <h5 className="AccountInfo-section-header">{translate('sidebar_AccountAddr')}</h5>
        <div className="AccountInfo-section AccountInfo-address-section">
          <div className="AccountInfo-address-icon">
            <Identicon address={address} size="100%" />
          </div>
          <div className="AccountInfo-address-wrapper">
            <div className="AccountInfo-address-addr">{address}</div>
          </div>
        </div>

        {typeof wallet.displayAddress === 'function' && (
          <div className="AccountInfo-section">
            <a
              className="AccountInfo-address-hw-addr"
              onClick={() => {
                this.toggleConfirmAddr();
                wallet
                  .displayAddress()
                  .then(() => this.toggleConfirmAddr())
                  .catch(e => {
                    this.toggleConfirmAddr();
                    throw new Error(e);
                  });
              }}
            >
              {confirmAddr ? null : 'Display address on ' + wallet.getWalletType()}
            </a>
            {confirmAddr ? (
              <span className="AccountInfo-address-confirm">
                <Spinner /> Confirm address on {wallet.getWalletType()}
              </span>
            ) : null}
          </div>
        )}

        <div className="AccountInfo-section">
          <h5 className="AccountInfo-section-header">{translate('sidebar_AccountBal')}</h5>
          <ul className="AccountInfo-list">
            <li className="AccountInfo-list-item AccountInfo-balance">
              <span
                className="AccountInfo-list-item-clickable AccountInfo-balance-amount mono wrap"
                onClick={this.toggleShowLongBalance}
              >
                <UnitDisplay
                  value={balance.wei}
                  unit={'ether'}
                  displayShortBalance={!showLongBalance}
                  checkOffline={true}
                  symbol={balance.wei ? network.name : null}
                />
              </span>
              {balance.wei && (
                <React.Fragment>
                  {balance.isPending ? (
                    <Spinner />
                  ) : (
                    !isOffline && (
                      <button
                        className="AccountInfo-section-refresh"
                        onClick={this.props.setAccountBalance}
                      >
                        <i className="fa fa-refresh" />
                      </button>
                    )
                  )}
                </React.Fragment>
              )}
            </li>
          </ul>
        </div>

        {(!!blockExplorer || !!tokenExplorer) && (
          <div className="AccountInfo-section">
            <h5 className="AccountInfo-section-header">{translate('sidebar_TransHistory')}</h5>
            <ul className="AccountInfo-list">
              {!!blockExplorer && (
                <li className="AccountInfo-list-item">
                  <a
                    href={blockExplorer.addressUrl(address)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {`${network.name} (${blockExplorer.origin})`}
                  </a>
                </li>
              )}
              {!!tokenExplorer && (
                <li className="AccountInfo-list-item">
                  <a
                    href={tokenExplorer.address(address)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {`Tokens (${tokenExplorer.name})`}
                  </a>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    );
  }
}
function mapStateToProps(state: AppState): StateProps {
  return {
    balance: state.wallet.balance,
    network: getNetworkConfig(state),
    isOffline: getOffline(state)
  };
}
const mapDispatchToProps: DispatchProps = { setAccountBalance };
export default connect(mapStateToProps, mapDispatchToProps)(AccountInfo);
