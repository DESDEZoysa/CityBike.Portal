import { Component, OnInit, Input } from '@angular/core';
import { Bike } from '../../core/models';
import { LoggerService, BikesService } from '../../services';

@Component({
  selector: 'app-bike-comment',
  templateUrl: './bike-comment.component.html',
  styleUrls: ['./bike-comment.component.scss']
})
export class BikeCommentComponent implements OnInit {
  @Input() bike: Bike;

  comments: string;
  bikeCommentDetails: any;

  constructor(
    private bikesService: BikesService,
    private loggerService: LoggerService
  ) { }

  ngOnInit() {
    this.getComments();
  }

  getComments() {
    if (this.bike) {
      this.bikesService.getBikesComments(this.bike.BikeId)
        .subscribe(result => {
          if (result != null) {
            this.bikeCommentDetails = result;
            this.comments = result['Comment'];
          }
        }, error => {
          this.loggerService.showErrorMessage("Getting bike comment details failed!");
        });
    }
  }

  saveComment() {
    if (typeof (this.bikeCommentDetails) != "undefined") {
      //update a comment
      this.bikeCommentDetails['Comment'] = this.comments;
      this.bikesService.UpdateBikeComment(this.bikeCommentDetails)
        .subscribe(result => {
          this.loggerService.showSuccessfulMessage("Bike comment details updated successfully.");
        }, error => {
          this.loggerService.showErrorMessage("Updating bike comment details failed!");
        });

    } else {
      // creata a comment
      var bikeComment = {
        BikeId: this.bike.BikeId,
        Comment: this.comments
      };
      this.bikesService.CreateBikeComment(bikeComment)
        .subscribe(result => {
          this.bikeCommentDetails = result;
          this.loggerService.showSuccessfulMessage("Bike comment details saved successfully.");
        }, error => {
          this.loggerService.showErrorMessage("Saving bike comment details failed!");
        });
    }
  }

}
