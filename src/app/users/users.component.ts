import { Component, OnInit, ViewChild } from '@angular/core';
import { UserService } from '../services/users.service';
import { LoggerService } from '../services';
import { User } from '../core/models/user/user';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { ScreenLayouts } from '../core/constants/screen-layouts';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  @ViewChild('userTable', { static: true }) table: any;

  public users: User[] = [];
  public allUsers: User[] = [];
  loadingIndicator: boolean = true;
  reorderable: boolean = true;
  isMobile: boolean = false;
  searchItem: string = "";

  public readonly LAYOUT = ScreenLayouts;
  public layout: number = this.LAYOUT.MD;

  constructor(
    private userService: UserService,
    private loggerService: LoggerService,
    public breakpointObserver: BreakpointObserver) {

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      && (document.documentElement.clientWidth < 768)) {
      this.isMobile = true;
    }
  }

  ngOnInit() {
    this.manageScreenWidth();
    this.loadSystemUsers();
  }

  manageScreenWidth() {
    const breakpoints = Object.keys(this.LAYOUT).map(k => this.LAYOUT[k]);
    breakpoints.forEach((maxWidth, index) => {
      const minWidth = (index > 0) ? breakpoints[index - 1] : 0;
      this.breakpointObserver
        .observe([`(min-width: ${minWidth}px) and (max-width: ${maxWidth - 1}px)`])
        .subscribe((state: BreakpointState) => {
          if (!state.matches) { return; }
          this.layout = maxWidth;
          //console.log('Layout', this.layout);
        });
    });
  }

  onResize() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      && (document.documentElement.clientWidth < 768)) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  protected loadSystemUsers(): void {
    this.userService.getSystemUsers().subscribe(data => {
      this.users = data;
      this.allUsers = data;
      this.loadingIndicator = false;
    },
      error => {
        this.loadingIndicator = false;
        if (error.status == 403) {
          this.loggerService.showErrorMessage("Don't have permission to obtain data");
        } else {
          this.loggerService.showErrorMessage(error);
        }
      });
  }

  toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
  }

  searchUser(event) {
    if (this.searchItem === null || this.searchItem === "") {
      //this.loadSystemUsers();
      this.users = this.allUsers;
    }
    else {
      if (this.users != null) {
        this.users = this.users.filter(b => b.FirstName.toLowerCase().indexOf(this.searchItem) > -1
          || b.LastName.toLowerCase().indexOf(this.searchItem.toLowerCase()) > -1
          || b.Email.toLowerCase().indexOf(this.searchItem.toLowerCase()) > -1
          || b.MobileNumber.indexOf(this.searchItem.toLowerCase()) > -1
        );
      }
    }
  }

  ngOnDestroy(): void {
    this.users = null;
  }
}
